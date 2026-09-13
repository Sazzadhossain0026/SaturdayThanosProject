import { NextRequest, NextResponse } from "next/server";
import { verifyAndHandleTwilioStatusCallback } from "@/server/mock-twilio";

/**
 * Twilio status callbacks arrive as `application/x-www-form-urlencoded`,
 * signed over the exact URL Twilio was configured to POST to plus every
 * form field. We rebuild that same params object from the raw body rather
 * than trusting `request.formData()` field ordering, to match what
 * mock-twilio.ts signed on the way out.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));
  const signature = request.headers.get("x-twilio-signature");
  const url = `${request.nextUrl.origin}${request.nextUrl.pathname}`;

  const result = verifyAndHandleTwilioStatusCallback(url, params, signature);
  if (!result.ok) {
    console.warn("twilio webhook rejected:", result.error);
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ received: true, duplicate: result.duplicate });
}
