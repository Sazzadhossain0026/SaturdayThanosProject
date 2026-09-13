import crypto from "crypto";
import { db } from "./db";
import { confirmOrderPayment, failOrderPayment } from "./orders";

/**
 * A local stand-in for Stripe. No network calls, no real account — but the
 * PaymentIntent lifecycle, the webhook payload shape, and the signature
 * verification algorithm all match Stripe's real ones closely enough that
 * swapping this module for the real `stripe` SDK later should not require
 * touching the API routes that call it. See CLAUDE.md → "Stripe simulation".
 */

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_demo_secret_do_not_use_in_prod";
const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

// Standard Stripe *test-mode* card numbers. Anything not listed here is
// treated as a decline, same as this app would want to happen if a bogus
// number were ever submitted in test mode.
const TEST_CARDS: Record<string, { outcome: "succeed" } | { outcome: "decline"; code: string; message: string }> = {
  "4242424242424242": { outcome: "succeed" },
  "4000000000000002": { outcome: "decline", code: "card_declined", message: "Your card was declined." },
  "4000000000009995": {
    outcome: "decline",
    code: "insufficient_funds",
    message: "Your card has insufficient funds.",
  },
  "4000000000000069": { outcome: "decline", code: "expired_card", message: "Your card has expired." },
};

export interface CreatedPaymentIntent {
  id: string;
  clientSecret: string;
  amountCents: number;
}

export function createPaymentIntent(orderId: string, amountCents: number): CreatedPaymentIntent {
  const id = `pi_${crypto.randomBytes(12).toString("hex")}`;
  const clientSecret = `${id}_secret_${crypto.randomBytes(8).toString("hex")}`;
  db.prepare(
    `INSERT INTO payment_intents (id, order_id, amount_cents, status, created_at)
     VALUES (?, ?, ?, 'requires_confirmation', ?)`,
  ).run(id, orderId, amountCents, Date.now());
  return { id, clientSecret, amountCents };
}

function signPayload(rawBody: string, timestamp: number): string {
  const hmac = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  return `t=${timestamp},v1=${hmac}`;
}

export function verifyStripeSignature(rawBody: string, header: string | null): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => kv.split("=") as [string, string]),
  );
  const timestamp = Number(parts.t);
  const signature = parts.v1;
  if (!timestamp || !signature) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > SIGNATURE_TOLERANCE_SECONDS) return false;
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  // Constant-time comparison — same reason the real Stripe SDK uses it.
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

type StripeEventType = "payment_intent.succeeded" | "payment_intent.payment_failed";

interface StripeEvent {
  id: string;
  type: StripeEventType;
  data: { object: { id: string; status: string; last_payment_error?: { message: string } } };
}

function buildEvent(type: StripeEventType, paymentIntentId: string, errorMessage?: string): StripeEvent {
  return {
    id: `evt_${crypto.randomBytes(12).toString("hex")}`,
    type,
    data: {
      object: {
        id: paymentIntentId,
        status: type === "payment_intent.succeeded" ? "succeeded" : "requires_payment_method",
        ...(errorMessage ? { last_payment_error: { message: errorMessage } } : {}),
      },
    },
  };
}

/**
 * The single entry point real Stripe webhook deliveries AND our in-process
 * simulated deliveries both go through. Idempotency (the fix for "webhook
 * arrives twice") lives here: payment_events.stripe_event_id is UNIQUE, so a
 * duplicate delivery's INSERT fails the uniqueness check and we bail out
 * before touching order state or sending another SMS.
 */
export function handleStripeEvent(event: StripeEvent): { duplicate: boolean } {
  const inserted = db
    .prepare(
      `INSERT OR IGNORE INTO payment_events (stripe_event_id, type, payment_intent_id, received_at)
       VALUES (?, ?, ?, ?)`,
    )
    .run(event.id, event.type, event.data.object.id, Date.now());

  if (inserted.changes === 0) {
    // We've already processed this exact event id. Stripe explicitly
    // recommends this pattern because at-least-once delivery means retries
    // (network blips, slow 2xx, redeployments) are normal, not exceptional.
    return { duplicate: true };
  }

  if (event.type === "payment_intent.succeeded") {
    confirmOrderPayment(event.data.object.id);
  } else if (event.type === "payment_intent.payment_failed") {
    failOrderPayment(event.data.object.id, event.data.object.last_payment_error?.message ?? "Payment failed");
  }
  return { duplicate: false };
}

export function verifyAndHandleRawStripeWebhook(
  rawBody: string,
  signatureHeader: string | null,
): { ok: true; duplicate: boolean } | { ok: false; error: string } {
  if (!verifyStripeSignature(rawBody, signatureHeader)) {
    return { ok: false, error: "invalid signature" };
  }
  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return { ok: false, error: "invalid JSON" };
  }
  const { duplicate } = handleStripeEvent(event);
  return { ok: true, duplicate };
}

/**
 * Simulates confirming a PaymentIntent client-side (what Stripe.js would do
 * against a real card element) and — separately, after a short delay, like
 * a real webhook — delivers the resulting event to the webhook handler.
 *
 * The delay is the whole point: it recreates the real-world race where the
 * client "knows" the card worked before the server's source of truth
 * (the webhook) has actually confirmed the order. See ORDER_FLOW section
 * in CLAUDE.md and the /api/checkout/confirm route for how the UI handles
 * that gap (optimistic "confirming..." state, not "confirmed").
 */
export function confirmPaymentIntent(
  paymentIntentId: string,
  cardNumber: string,
): { outcome: "succeed" } | { outcome: "decline"; code: string; message: string } {
  const digits = cardNumber.replace(/\s+/g, "");
  const result = TEST_CARDS[digits] ?? {
    outcome: "decline" as const,
    code: "card_not_supported",
    message: "Use a Stripe test card number, e.g. 4242 4242 4242 4242.",
  };

  db.prepare("UPDATE payment_intents SET status = ? WHERE id = ?").run(
    result.outcome === "succeed" ? "succeeded" : "requires_payment_method",
    paymentIntentId,
  );

  const deliverWebhook = () => {
    const event = buildEvent(
      result.outcome === "succeed" ? "payment_intent.succeeded" : "payment_intent.payment_failed",
      paymentIntentId,
      result.outcome === "decline" ? result.message : undefined,
    );
    const rawBody = JSON.stringify(event);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = signPayload(rawBody, timestamp);
    // In dev/tests we call the same verified handler a real HTTP delivery
    // would hit — see /api/webhooks/stripe/route.ts, which does the same
    // verifyAndHandleRawStripeWebhook(rawBody, header) call.
    verifyAndHandleRawStripeWebhook(rawBody, signature);
  };

  // ~600ms mirrors the real gap between "Stripe.js confirmCardPayment()
  // resolves" and "your webhook endpoint gets POSTed to" in production.
  setTimeout(deliverWebhook, 600);

  return result;
}

/**
 * Test/demo helper: builds a real, correctly-signed succeeded event for a
 * given PaymentIntent without waiting on the 600ms timer, so tests (and the
 * duplicate-delivery race-condition check) can send the *exact same* event
 * twice and assert the second delivery is a no-op. Real Stripe retries
 * resend the identical event id — that's the case this reproduces.
 */
export function buildSignedSucceededWebhook(paymentIntentId: string, eventId?: string) {
  const event = buildEvent("payment_intent.succeeded", paymentIntentId);
  if (eventId) event.id = eventId;
  const rawBody = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  return { rawBody, signature: signPayload(rawBody, timestamp), eventId: event.id };
}

export { TEST_CARDS };
