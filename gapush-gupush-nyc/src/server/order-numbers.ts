import { DbClient } from "./db";

/**
 * Atomically claims the next order number (GG-1042, GG-1043, ...).
 *
 * Same shape of bug as the inventory race: "read value, add one, write
 * value back" is unsafe if two requests interleave between the read and
 * the write. `UPDATE ... RETURNING` does the read-increment-write in one
 * statement — combined with running inside the same transaction as the
 * rest of order creation (so a sold-out rollback doesn't leave a gap),
 * there's no window for two concurrent checkouts to be handed the same
 * number.
 */
export async function claimNextOrderNumber(client: DbClient): Promise<string> {
  const result = await client.query<{ value: number }>(
    `UPDATE counters SET value = value + 1
     WHERE name = 'order_number'
     RETURNING value`,
  );
  const row = result.rows[0];
  if (!row) throw new Error("order_number counter is missing — did db init run?");
  return `GG-${row.value}`;
}
