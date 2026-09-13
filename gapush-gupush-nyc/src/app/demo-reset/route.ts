import { NextRequest, NextResponse } from "next/server";
import { resetDemoData } from "@/server/db";

/**
 * One-tap demo reset. Bookmark
 *   https://<host>/demo-reset?key=<DEMO_RESET_SECRET>
 * to your phone's home screen (Safari/Chrome "Add to Home Screen") — tapping
 * it is the whole interaction: GET request in, reset runs, confirmation
 * renders. No dashboard, no second button.
 *
 * The query-param secret is deliberately NOT real security — it's here so a
 * stray crawler or a coworker fat-fingering the URL bar doesn't wipe a demo
 * mid-pitch. Never reuse this pattern for anything that matters.
 */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  const expected = process.env.DEMO_RESET_SECRET ?? "letmein";

  if (!key || key !== expected) {
    return new NextResponse(page("🔒 Forbidden", "Missing or incorrect ?key=… on this link.", false), {
      status: 403,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  resetDemoData();

  return new NextResponse(
    page(
      "✅ Demo reset",
      "All orders, payments, and SMS logs are cleared. Inventory (including the 3-unit Naga Shingara demo item) is back to full stock.",
      true,
    ),
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

function page(title: string, message: string, success: boolean) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
  :root { color-scheme: light; }
  body { margin:0; min-height:100dvh; display:flex; align-items:center; justify-content:center;
         background:#fff8f2; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
         padding: 24px; box-sizing: border-box; }
  .card { max-width: 420px; width:100%; background:#fff; border-radius:24px; padding:32px 24px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.08); text-align:center; }
  h1 { font-size: 22px; margin: 0 0 12px; color: #211a14; }
  p { font-size: 15px; line-height:1.5; color:#6b6058; margin:0 0 24px; }
  a { display:inline-block; padding: 14px 20px; border-radius:16px; background:${success ? "#0b3d3a" : "#e85d2a"};
      color:#fff; text-decoration:none; font-weight:700; font-size:14px; margin: 0 6px 10px; }
</style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    ${success ? '<a href="/kitchen">Open Kitchen View</a><a href="/">Home</a>' : '<a href="/">Home</a>'}
  </div>
</body>
</html>`;
}
