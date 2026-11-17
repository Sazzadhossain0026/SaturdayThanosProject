import { DbClient, query } from "./db";

export class SoldOutError extends Error {
  constructor(public menuItemId: string) {
    super(`${menuItemId} is sold out`);
  }
}

/**
 * ---------------------------------------------------------------------------
 * THE BUG (see CLAUDE.md's race-condition writeup + tests/race-conditions.spec.ts)
 * ---------------------------------------------------------------------------
 * The naive way to decrement stock is:
 *
 *   const row = await client.query("SELECT quantity_available FROM inventory WHERE menu_item_id = $1", [id]);
 *   if (row.rows[0].quantity_available < qty) throw new SoldOutError(id);
 *   await someAsyncWork();   // <-- any await here is enough
 *   await client.query("UPDATE inventory SET quantity_available = $1 WHERE menu_item_id = $2",
 *     [row.rows[0].quantity_available - qty, id]);
 *
 * With one unit left, two customers hitting "Confirm" at the same moment can
 * both read quantity_available = 1, both pass the check, and both write
 * quantity_available = 0 — the item was sold twice.
 *
 * ---------------------------------------------------------------------------
 * THE FIX
 * ---------------------------------------------------------------------------
 * Do the check and the decrement as ONE statement, so Postgres's own row
 * locking does the work — the UPDATE takes a row lock on the matching
 * inventory row for the duration of the transaction, so a second concurrent
 * UPDATE against the same row simply waits until the first transaction
 * commits or rolls back, then re-evaluates the WHERE clause against the
 * now-updated value. There is no read-then-write gap for two requests to
 * interleave in.
 * ---------------------------------------------------------------------------
 */
export async function reserveInventory(
  client: DbClient,
  lines: { menuItemId: string; quantity: number }[],
): Promise<void> {
  for (const line of lines) {
    const result = await client.query(
      `UPDATE inventory
       SET quantity_available = quantity_available - $1
       WHERE menu_item_id = $2 AND quantity_available >= $1`,
      [line.quantity, line.menuItemId],
    );
    if (result.rowCount === 0) {
      // Either the item doesn't exist, or there wasn't enough stock.
      // Throwing here is caught by withTransaction(), which rolls back
      // everything this reservation already decremented in this same
      // checkout — no partial order, no partially-decremented stock.
      throw new SoldOutError(line.menuItemId);
    }
  }
}

export async function releaseInventory(
  client: DbClient,
  lines: { menuItemId: string; quantity: number }[],
): Promise<void> {
  for (const line of lines) {
    await client.query(
      `UPDATE inventory SET quantity_available = quantity_available + $1 WHERE menu_item_id = $2`,
      [line.quantity, line.menuItemId],
    );
  }
}

export async function getInventorySnapshot() {
  return query<{ menu_item_id: string; quantity_available: number; is_limited: boolean }>(
    "SELECT * FROM inventory ORDER BY menu_item_id",
  );
}
