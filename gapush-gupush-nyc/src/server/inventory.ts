import { db } from "./db";

export class SoldOutError extends Error {
  constructor(public menuItemId: string) {
    super(`${menuItemId} is sold out`);
  }
}

/**
 * ---------------------------------------------------------------------------
 * THE BUG (see RACE_CONDITIONS.md for the full writeup + a reproducing test)
 * ---------------------------------------------------------------------------
 * The naive way to decrement stock is:
 *
 *   const row = db.prepare("SELECT quantity_available FROM inventory WHERE menu_item_id = ?").get(id);
 *   if (row.quantity_available < qty) throw new SoldOutError(id);
 *   await someAsyncWork();   // <-- anything awaited here, even logging, is enough
 *   db.prepare("UPDATE inventory SET quantity_available = ? WHERE menu_item_id = ?")
 *     .run(row.quantity_available - qty, id);
 *
 * With one unit left, two customers hitting "Confirm" at the same moment can
 * both read quantity_available = 1, both pass the check, and both write
 * quantity_available = 0 — the item was sold twice. This isn't hypothetical:
 * tests/race-conditions.test.mjs reproduces it against a copy of this exact
 * read-then-write shape.
 *
 * ---------------------------------------------------------------------------
 * THE FIX
 * ---------------------------------------------------------------------------
 * Do the check and the decrement as ONE statement, so there is no gap for a
 * second request to land in. better-sqlite3 statements are synchronous, so
 * as long as we never `await` between the read and the write, no other
 * request's JS can interleave — the whole reservation is one tick of the
 * event loop. (The same fix applies verbatim on Postgres/Supabase: `UPDATE
 * inventory SET qty = qty - $1 WHERE item_id = $2 AND qty >= $1`.)
 * ---------------------------------------------------------------------------
 */
export function reserveInventory(
  lines: { menuItemId: string; quantity: number }[],
): void {
  const reserve = db.transaction(() => {
    for (const line of lines) {
      const result = db
        .prepare(
          `UPDATE inventory
           SET quantity_available = quantity_available - ?
           WHERE menu_item_id = ? AND quantity_available >= ?`,
        )
        .run(line.quantity, line.menuItemId, line.quantity);
      if (result.changes === 0) {
        // Either the item doesn't exist, or there wasn't enough stock.
        // Throwing inside a db.transaction() rolls back everything this
        // reservation already decremented in this same checkout.
        throw new SoldOutError(line.menuItemId);
      }
    }
  });
  reserve();
}

export function releaseInventory(lines: { menuItemId: string; quantity: number }[]): void {
  const release = db.transaction(() => {
    for (const line of lines) {
      db.prepare(
        `UPDATE inventory SET quantity_available = quantity_available + ? WHERE menu_item_id = ?`,
      ).run(line.quantity, line.menuItemId);
    }
  });
  release();
}

export function getInventorySnapshot() {
  return db.prepare("SELECT * FROM inventory ORDER BY menu_item_id").all();
}
