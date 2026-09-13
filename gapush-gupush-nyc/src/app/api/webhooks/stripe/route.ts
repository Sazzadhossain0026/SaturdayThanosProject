import { NextRequest, NextResponse } from "next/server";
import { verifyAndHandleRawStripeWebhook } from "@/server/mock-stripe";

/**
 * Real Stripe webhook endpoints must read the RAW request body — not
 * `request.json()` — because signature verification is computed over the
 * exact bytes Stripe sent. Re-serializing a parsed object can produce a
 * byte-for-byte different string (key order, whitespace) and make a valid
 * signature look invalid.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  const result = verifyAndHandleRawStripeWebhook(rawBody, signature);
  if (!result.ok) {
    // Stripe retries on non-2xx, but a bad signature should never be
    // retried into validity — 400 it and log, don't 500.
    console.warn("stripe webhook rejected:", result.error);
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Always 200 on a verified event, duplicate or not — Stripe's own docs
  // are explicit that returning non-2xx on an already-processed event just
  // triggers pointless retries.
  return NextResponse.json({ received: true, duplicate: result.duplicate });
}
