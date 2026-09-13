import crypto from "crypto";
import { db } from "./db";

/**
 * A local stand-in for Twilio. Messages never leave the process — they're
 * written to sms_events so tests and the kitchen/owner UI can read exactly
 * what "would have" been sent — but the status-callback webhook shape and
 * signature algorithm match Twilio's real ones. See CLAUDE.md → "Twilio
 * simulation".
 */

const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? "demo_test_auth_token_do_not_use_in_prod";
const FROM_NUMBER = process.env.TWILIO_FROM_NUMBER ?? "+15550123456";
// Twilio's documented "magic" test numbers — used only for realism in logs.
export const TWILIO_TEST_CREDENTIALS = {
  accountSid: process.env.TWILIO_ACCOUNT_SID ?? "ACtest0000000000000000000000000000",
  authToken: AUTH_TOKEN,
  fromNumber: FROM_NUMBER,
};

export type SmsKind = "order_received" | "order_ready";

/**
 * Twilio signs status-callback requests with:
 *   base64(hmac-sha1(authToken, url + sorted(key+value for each param)))
 * This is the real algorithm (see twilio/lib/webhooks/webhooks.ts upstream)
 * so a signature-verification bug here would be a real bug there too.
 */
export function signTwilioRequest(url: string, params: Record<string, string>): string {
  const sortedKeys = Object.keys(params).sort();
  const data = sortedKeys.reduce((acc, key) => acc + key + params[key], url);
  return crypto.createHmac("sha1", AUTH_TOKEN).update(Buffer.from(data, "utf-8")).digest("base64");
}

export function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader) return false;
  const expected = signTwilioRequest(url, params);
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function statusCallbackUrl(): string {
  return `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/api/webhooks/twilio`;
}

/**
 * "Sends" an SMS: records it immediately with status=queued (this is what
 * the order-received / order-ready confirmation depends on — see
 * orders.ts), then simulates Twilio's async status-callback webhook
 * delivering status=delivered a moment later, through the same verified
 * handler the real HTTP route uses.
 */
export function sendSms(orderId: string, toPhone: string, body: string, kind: SmsKind) {
  const sid = `SM${crypto.randomBytes(16).toString("hex")}`;
  db.prepare(
    `INSERT INTO sms_events (id, order_id, to_phone, body, kind, twilio_sid, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'queued', ?)`,
  ).run(crypto.randomUUID(), orderId, toPhone, body, kind, sid, Date.now());

  setTimeout(() => {
    const url = statusCallbackUrl();
    const params = { MessageSid: sid, MessageStatus: "delivered", To: toPhone, From: FROM_NUMBER };
    const signature = signTwilioRequest(url, params);
    verifyAndHandleTwilioStatusCallback(url, params, signature);
  }, 400);

  return { sid, status: "queued" as const };
}

export function verifyAndHandleTwilioStatusCallback(
  url: string,
  params: Record<string, string>,
  signatureHeader: string | null,
): { ok: true; duplicate: boolean } | { ok: false; error: string } {
  if (!verifyTwilioSignature(url, params, signatureHeader)) {
    return { ok: false, error: "invalid signature" };
  }
  const { MessageSid, MessageStatus } = params;
  if (!MessageSid || !MessageStatus) return { ok: false, error: "missing MessageSid/MessageStatus" };

  // Idempotency: Twilio can (and does) redeliver the same status callback.
  // UNIQUE(twilio_sid, status) means a repeat of the *same* status is a
  // no-op; a genuinely new status (queued -> delivered -> undelivered) still
  // gets recorded.
  const inserted = db
    .prepare(
      `INSERT OR IGNORE INTO sms_status_events (id, twilio_sid, status, received_at) VALUES (?, ?, ?, ?)`,
    )
    .run(crypto.randomUUID(), MessageSid, MessageStatus, Date.now());

  if (inserted.changes === 0) {
    return { ok: true, duplicate: true };
  }

  db.prepare("UPDATE sms_events SET status = ? WHERE twilio_sid = ?").run(MessageStatus, MessageSid);
  return { ok: true, duplicate: false };
}

export function getSmsEventsForOrder(orderId: string) {
  return db
    .prepare("SELECT * FROM sms_events WHERE order_id = ? ORDER BY created_at ASC")
    .all(orderId);
}
