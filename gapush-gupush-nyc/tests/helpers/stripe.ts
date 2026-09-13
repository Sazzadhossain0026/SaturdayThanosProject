import crypto from "crypto";
import { TEST_ENV } from "../../playwright.config";

/**
 * Deliberately re-implements the same signing algorithm as
 * src/server/mock-stripe.ts's signPayload(), rather than importing the app
 * module directly. Tests should exercise the real HTTP webhook contract
 * (POST /api/webhooks/stripe with a body + header) like a real Stripe
 * delivery would, not reach into the server's internals — and the app's
 * `@/*` path alias isn't set up for Playwright's module resolver anyway.
 */
export function signStripeEvent(rawBody: string, timestamp = Math.floor(Date.now() / 1000)) {
  const signature = crypto
    .createHmac("sha256", TEST_ENV.STRIPE_WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

export function buildStripeSucceededEvent(paymentIntentId: string, eventId: string) {
  return {
    id: eventId,
    type: "payment_intent.succeeded" as const,
    data: { object: { id: paymentIntentId, status: "succeeded" } },
  };
}

export function buildStripeFailedEvent(paymentIntentId: string, eventId: string, message: string) {
  return {
    id: eventId,
    type: "payment_intent.payment_failed" as const,
    data: {
      object: { id: paymentIntentId, status: "requires_payment_method", last_payment_error: { message } },
    },
  };
}
