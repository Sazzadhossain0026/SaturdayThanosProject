import { NextRequest, NextResponse } from "next/server";
import { confirmPaymentIntent } from "@/server/mock-stripe";

/**
 * Mimics calling Stripe.js `confirmCardPayment(clientSecret, {card})` from
 * the browser. This tells the client whether the *card* was accepted, but —
 * on purpose — it does NOT flip the order to "confirmed" itself. That only
 * happens when the (separately, asynchronously delivered) webhook lands on
 * /api/webhooks/stripe. The client is expected to poll GET /api/orders/:id
 * until status leaves "pending_payment" — see useCheckout()'s "confirming"
 * state and CLAUDE.md's race-condition writeup for why this gap is
 * deliberate rather than an oversight.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.paymentIntentId || !body?.cardNumber) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  // Simulate real network/processing latency for the card confirmation
  // itself (separate from the webhook delay in mock-stripe.ts).
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 400));

  const result = confirmPaymentIntent(body.paymentIntentId, body.cardNumber);
  if (result.outcome === "decline") {
    return NextResponse.json({ outcome: "decline", code: result.code, message: result.message }, { status: 402 });
  }
  return NextResponse.json({ outcome: "succeed" });
}
