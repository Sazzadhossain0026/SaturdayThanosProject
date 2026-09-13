import { db } from "./db";

/**
 * Atomically claims the next order number (GG-1042, GG-1043, ...).
 *
 * This is the same shape of bug as the inventory race: "read value, add one,
 * write value back" is unsafe if two requests interleave between the read
 * and the write. `UPDATE ... RETURNING` does the read-increment-write in one
 * statement, so there is no window for two concurrent checkouts to be handed
 * the same number.
 */
export function claimNextOrderNumber(): string {
  const row = db
    .prepare(
      `UPDATE counters SET value = value + 1
       WHERE name = 'order_number'
       RETURNING value`,
    )
    .get() as { value: number } | undefined;
  if (!row) throw new Error("order_number counter is missing — did db init run?");
  return `GG-${row.value}`;
}
