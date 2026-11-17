import { Client, types } from "pg";
import { TEST_ENV } from "../../playwright.config";

/**
 * Tests read the same Postgres database the app writes to for this run
 * (see src/server/db.ts / playwright.config.ts's TEST_ENV.DATABASE_URL) so
 * we can assert on things the UI never surfaces directly — e.g. the exact
 * SMS body text Twilio would have been asked to send, or that a duplicate
 * webhook really did no-op at the payment_events level.
 */

// Same reasoning as src/server/db.ts: BIGINT (oid 20) columns here are all
// epoch-millisecond timestamps, safely within Number range.
types.setTypeParser(20, (val: string) => parseInt(val, 10));

async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: TEST_ENV.DATABASE_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
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

export async function getSmsEventsForOrder(orderId: string): Promise<SmsEventRow[]> {
  return withClient(async (client) => {
    const { rows } = await client.query<SmsEventRow>(
      "SELECT * FROM sms_events WHERE order_id = $1 ORDER BY created_at ASC",
      [orderId],
    );
    return rows;
  });
}

export async function getPaymentEventCount(paymentIntentId: string): Promise<number> {
  return withClient(async (client) => {
    const { rows } = await client.query<{ c: number }>(
      "SELECT COUNT(*)::int as c FROM payment_events WHERE payment_intent_id = $1",
      [paymentIntentId],
    );
    return rows[0].c;
  });
}
