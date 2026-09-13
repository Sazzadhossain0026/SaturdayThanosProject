// Manual demo script (not part of `npx playwright test`) — throttles a real
// Chromium network stack to a slow/flaky mobile connection via CDP and
// walks through checkout, screenshotting what the customer actually sees
// at each point: optimistic UI immediately after tapping "Place Order",
// the retry-with-backoff state when the connection drops mid-checkout, and
// the final clear error state when it never recovers.
//
// Usage: node tests/manual/simulate-3g.mjs
// Expects a dev server already running on BASE_URL (see playwright.config.ts
// TEST_ENV for the env vars it needs).

import { chromium, devices } from "@playwright/test";

async function pollForStableHeading(page, text, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const current = await page.locator("h1").textContent().catch(() => "");
    if (current && current.includes(text)) {
      // Confirm it's stable, not a transient frame between two states.
      await new Promise((r) => setTimeout(r, 500));
      const again = await page.locator("h1").textContent().catch(() => "");
      if (again && again.includes(text)) return;
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`heading never stabilized on "${text}"`);
}
import fs from "fs";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3100";
const OUT_DIR = process.env.OUT_DIR ?? "/tmp/shots-3g";
const RESET_KEY = process.env.DEMO_RESET_KEY ?? "letmein";

fs.mkdirSync(OUT_DIR, { recursive: true });

// Chrome DevTools' "Slow 3G" preset.
const SLOW_3G = {
  offline: false,
  latency: 400, // ms round-trip
  downloadThroughput: (500 * 1024) / 8, // 500kbps
  uploadThroughput: (500 * 1024) / 8,
};
const OFFLINE = { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 };

async function shot(page, name) {
  // The app scrolls to top on every phase change (see checkout/page.tsx),
  // but a screenshot taken the instant a state's text appears can still
  // land a render tick ahead of that effect. Enforce it here too so what
  // gets captured is the same thing a viewer scrolling up half a second
  // later would see, not a transient mid-transition frame.
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  await page.waitForTimeout(200);
  const path = `${OUT_DIR}/${name}.png`;
  await page.screenshot({ path });
  console.log("saved", path);
}

async function resetDemo() {
  const res = await fetch(`${BASE_URL}/demo-reset?key=${RESET_KEY}`);
  console.log("demo-reset:", res.status);
}

// Under real 3G, the server-rendered HTML can paint well before React has
// finished downloading/hydrating — a click that lands in that gap is
// silently ignored by the not-yet-interactive button. Retry the click
// (cheap and idempotent here) until it actually opens the modal, instead of
// guessing a fixed hydration delay.
async function addItemViaMenu(page, itemName) {
  const card = page.locator(".rounded-2xl.bg-white", {
    has: page.getByRole("heading", { name: itemName, exact: true }),
  });
  const modalHeading = page.getByRole("heading", { name: itemName, level: 2 });
  for (let attempt = 1; attempt <= 8; attempt++) {
    await card.getByRole("button", { name: "Add" }).click();
    try {
      await modalHeading.waitFor({ state: "visible", timeout: 1500 });
      return;
    } catch {
      // not hydrated yet (or the click just missed) — try again
    }
  }
  throw new Error(`Could not open the customize modal for ${itemName} after 8 attempts`);
}

async function main() {
  await resetDemo();

  const browser = await chromium.launch();
  const context = await browser.newContext({ ...devices["iPhone 13"], baseURL: BASE_URL });
  const page = await context.newPage();
  page.on("console", (m) => { if (m.text().includes("[debug]")) console.log(m.text()); });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");

  console.log("\n=== Scenario A: browsing + checkout entirely on Slow 3G ===");
  await cdp.send("Network.emulateNetworkConditions", SLOW_3G);

  const t0 = Date.now();
  await page.goto(`${BASE_URL}/menu`, { waitUntil: "domcontentloaded" });
  console.log("menu first paint under Slow 3G:", Date.now() - t0, "ms");
  await shot(page, "a1-menu-slow-3g");

  await addItemViaMenu(page, "Beef Chap");
  await page.getByRole("button", { name: "Hot", exact: true }).click();
  await page.getByRole("button", { name: /Add to Cart/i }).click();
  await page.waitForTimeout(300);
  await shot(page, "a2-added-to-cart-slow-3g");

  await page.getByRole("button", { name: /View Cart/i }).first().click();
  await page.getByRole("button", { name: /Continue to Checkout/i }).click();
  await page.waitForURL("**/checkout");
  await shot(page, "a3-checkout-form-slow-3g");

  await page.getByPlaceholder("Your full name").fill("Slow Connection Sam");
  await page.getByPlaceholder("(555) 555-5555").fill("9175550001");
  await page.getByRole("button", { name: "Pay Online" }).click();
  await page.getByPlaceholder(/Card Number/).fill("4242 4242 4242 4242");
  await page.getByPlaceholder("MM/YY").fill("12/29");
  await page.getByPlaceholder("CVC").fill("123");

  const submitTime = Date.now();
  await page.getByRole("button", { name: /Place Order/i }).click();
  // The optimistic "Placing your order..." screen should appear almost
  // instantly — it's a client-side state change, not a network response.
  await page.getByText("Placing your order…").waitFor({ timeout: 1000 });
  console.log("optimistic 'Placing your order' appeared after:", Date.now() - submitTime, "ms (should be near-instant)");
  await shot(page, "a4-optimistic-placing-order-slow-3g");

  await page.waitForURL("**/order/**", { timeout: 20000 });
  await shot(page, "a5-order-confirming-slow-3g");
  await page.getByRole("heading", { name: "Order Confirmed!" }).waitFor({ timeout: 15000 });
  await shot(page, "a6-order-confirmed-slow-3g");
  console.log("Scenario A total (Slow 3G, still succeeds):", Date.now() - t0, "ms");

  console.log("\n=== Scenario B: connection drops mid-checkout, then recovers ===");
  await resetDemo();
  await cdp.send("Network.emulateNetworkConditions", SLOW_3G);
  await page.goto(`${BASE_URL}/menu`, { waitUntil: "domcontentloaded" });
  await addItemViaMenu(page, "Fuchka");
  await page.getByRole("button", { name: /Add to Cart/i }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /View Cart/i }).first().click();
  await page.getByRole("button", { name: /Continue to Checkout/i }).click();
  await page.waitForURL("**/checkout");
  await page.getByPlaceholder("Your full name").fill("Dropped Connection Dana");
  await page.getByPlaceholder("(555) 555-5555").fill("9175550002");
  // Pay at pickup this time — isolates the checkout retry queue from the
  // separate card-confirmation step.

  // Go fully offline right as the order is submitted.
  const submitClick = page.getByRole("button", { name: /Place Order/i }).click();
  await cdp.send("Network.emulateNetworkConditions", OFFLINE);
  await submitClick;
  await shot(page, "b1-offline-placing-order");

  // Let it retry a couple of times while offline — the retry banner should
  // show increasing attempt numbers.
  await page.waitForTimeout(1500);
  await shot(page, "b2-retrying-attempt-2-while-offline");
  await page.waitForTimeout(3000);
  await shot(page, "b3-retrying-later-attempt-while-offline");

  // Now restore connectivity — the in-flight retry loop should succeed on
  // its own without the customer doing anything.
  await cdp.send("Network.emulateNetworkConditions", SLOW_3G);
  await page.waitForURL("**/order/**", { timeout: 20000 });
  await shot(page, "b4-recovered-after-reconnect");
  console.log("Scenario B: recovered automatically after connection returned.");

  console.log("\n=== Scenario C: connection never comes back ===");
  await resetDemo();
  await cdp.send("Network.emulateNetworkConditions", SLOW_3G);
  await page.goto(`${BASE_URL}/menu`, { waitUntil: "domcontentloaded" });
  await addItemViaMenu(page, "Chotpoti");
  await page.getByRole("button", { name: /Add to Cart/i }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /View Cart/i }).first().click();
  await page.getByRole("button", { name: /Continue to Checkout/i }).click();
  await page.waitForURL("**/checkout");
  await page.getByPlaceholder("Your full name").fill("No Signal Nadia");
  await page.getByPlaceholder("(555) 555-5555").fill("9175550003");

  await cdp.send("Network.emulateNetworkConditions", OFFLINE);
  await page.getByRole("button", { name: /Place Order/i }).click();
  await shot(page, "c1-offline-placing-order");

  // Stay offline through every retry attempt (5 attempts, exponential
  // backoff up to 16s — this takes a while, which is realistic). Poll for
  // the heading text to actually settle (not just briefly appear) before
  // screenshotting, so we don't catch a mid-transition frame.
  await pollForStableHeading(page, "Connection trouble", 40000);
  await shot(page, "c2-final-clear-error-state");
  console.log("Scenario C: customer sees a clear 'order NOT placed' error after retries are exhausted.");

  // Prove the cart survived — "Edit Order" should take them right back to
  // a still-populated cart, not an empty one they'd have to rebuild.
  await cdp.send("Network.emulateNetworkConditions", SLOW_3G);
  await page.getByRole("button", { name: "Edit Order" }).click();
  await shot(page, "c3-cart-preserved-after-failure");

  await browser.close();
  console.log("\nAll scenarios complete. Screenshots in", OUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
