import Database from "better-sqlite3";
import path from "path";

/**
 * Tests read the same SQLite file the app writes to (see src/server/db.ts)
 * so we can assert on things the UI never surfaces directly — e.g. the
 * exact SMS body text Twilio would have been asked to send, or that a
 * duplicate webhook really did no-op at the payment_events level.
 */
const DB_PATH = path.join(process.cwd(), ".data", "gapush.db");

export function openTestDb(): Database.Database {
  return new Database(DB_PATH, { readonly: false, fileMustExist: false });
}

export interface SmsEventRow {
  id: string;
  order_id: string;
  to_phone: string;
  body: string;
  kind: string;
  twilio_sid: string;
  status: string;
  created_at: number;
}

export function getSmsEventsForOrder(db: Database.Database, orderId: string): SmsEventRow[] {
  return db
    .prepare("SELECT * FROM sms_events WHERE order_id = ? ORDER BY created_at ASC")
    .all(orderId) as SmsEventRow[];
}

export function getPaymentEventCount(db: Database.Database, paymentIntentId: string): number {
  return (
    db
      .prepare("SELECT COUNT(*) as c FROM payment_events WHERE payment_intent_id = ?")
      .get(paymentIntentId) as { c: number }
  ).c;
}
