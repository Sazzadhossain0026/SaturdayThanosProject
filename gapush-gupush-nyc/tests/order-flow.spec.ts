import { test, expect } from "@playwright/test";
import { resetDemo } from "./helpers/api";
import { getSmsEventsForOrder, openTestDb } from "./helpers/db";
import { TEST_ENV } from "../playwright.config";

/**
 * Full path per the brief: scan link → add 3 items → checkout with a
 * Stripe test card → order appears on the kitchen view → mark ready → both
 * SMS sent. "Twilio test credentials" here means the same stable
 * account-SID/auth-token shape Twilio's own docs call test credentials —
 * see src/server/mock-twilio.ts for why there's no real Twilio account
 * behind this (per the user's choice to simulate locally, no real
 * accounts).
 */

test.beforeEach(async ({ request }) => {
  await resetDemo(request);
});

test("scan → order 3 items → pay → kitchen sees it → ready → both SMS sent", async ({ page, request }) => {
  // The dev server for this run was booted (see playwright.config.ts
  // webServer.env) with these Twilio test credentials — the same
  // account-SID/auth-token shape Twilio's own docs use for testing, no
  // real account behind them. mock-twilio.ts signs every outbound status
  // callback with TWILIO_AUTH_TOKEN, so a wrong value here would make the
  // "delivered" status assertion below fail.
  expect(TEST_ENV.TWILIO_ACCOUNT_SID).toMatch(/^AC/);
  expect(TEST_ENV.TWILIO_AUTH_TOKEN).toBeTruthy();

  // --- "Scan link": a QR code on the table deep-links straight to the menu ---
  await page.goto("/menu?table=7&src=qr");
  await expect(page.getByRole("heading", { name: "Menu" })).toBeVisible();

  // --- Add 3 items ---
  await addItemToCart(page, "Beef Chap", "Hot");
  await addItemToCart(page, "Fuchka", "Medium");
  await page.getByRole("button", { name: "Fuchka & Chotpoti" }).click();
  await addItemToCart(page, "Chotpoti", "Medium");

  await expect(page.getByRole("button", { name: /View Cart/i }).first()).toContainText("3");

  // --- Checkout with a Stripe test card ---
  await page.getByRole("button", { name: /View Cart/i }).first().click();
  await page.getByRole("button", { name: /Continue to Checkout/i }).click();
  await page.waitForURL("**/checkout");

  await page.getByPlaceholder("Your full name").fill("Nusrat Playwright");
  await page.getByPlaceholder("(555) 555-5555").fill("9175559876");
  await page.getByRole("button", { name: "Pay Online" }).click();
  await page.getByPlaceholder(/Card Number/).fill("4242 4242 4242 4242");
  await page.getByPlaceholder("MM/YY").fill("12/29");
  await page.getByPlaceholder("CVC").fill("123");
  await page.getByRole("button", { name: /Place Order/i }).click();

  await page.waitForURL("**/order/**");
  const orderNumber = page.url().split("/order/")[1];
  expect(orderNumber).toMatch(/^GG-\d+$/);

  // Wait for the "confirming payment" optimistic state to resolve once the
  // simulated Stripe webhook lands.
  await expect(page.getByRole("heading", { name: "Order Confirmed!" })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(orderNumber)).toBeVisible();

  // --- Order appears on the kitchen view ---
  await page.goto("/kitchen");
  const kitchenCard = page.locator(".rounded-2xl.bg-white", { hasText: orderNumber });
  await expect(kitchenCard).toBeVisible({ timeout: 10_000 });
  await expect(kitchenCard).toContainText("Nusrat Playwright");
  await expect(kitchenCard.getByText("New", { exact: true })).toBeVisible();

  // --- Kitchen accepts, then marks ready ---
  await kitchenCard.getByRole("button", { name: "Accept Order" }).click();
  await expect(kitchenCard.getByRole("button", { name: "Mark Ready" })).toBeVisible({ timeout: 5000 });
  await kitchenCard.getByRole("button", { name: "Mark Ready" }).click();
  await expect(kitchenCard.getByRole("button", { name: "Mark Completed" })).toBeVisible({ timeout: 5000 });

  // The customer's tracking tab (still open) should reflect "ready" without
  // any manual refresh — it polls the same order.
  const trackingPage = page;
  // (kitchen view was opened in the same tab; re-open tracking to confirm state)
  await trackingPage.goto(`/order/${orderNumber}`);
  await expect(trackingPage.getByText("Ready for Pickup")).toBeVisible();

  // --- Both SMS sent, with the exact expected bodies ---
  const orderRes = await request.get(`/api/orders/${orderNumber}`);
  const { order } = await orderRes.json();

  const db = openTestDb();
  try {
    await expect
      .poll(() => getSmsEventsForOrder(db, order.id).length, { timeout: 5000 })
      .toBeGreaterThanOrEqual(2);

    const sms = getSmsEventsForOrder(db, order.id);
    const received = sms.find((s) => s.kind === "order_received");
    const ready = sms.find((s) => s.kind === "order_ready");

    expect(received, "order-received SMS should have been sent").toBeTruthy();
    expect(received!.to_phone).toBe("9175559876");
    expect(received!.body).toBe(`Gapush Gupush: We received order ${orderNumber}. We'll text you when it's ready.`);

    expect(ready, "order-ready SMS should have been sent").toBeTruthy();
    expect(ready!.to_phone).toBe("9175559876");
    expect(ready!.body).toBe(`Gapush Gupush: Your order ${orderNumber} is READY for pickup!`);

    // Twilio's status-callback loop (see mock-twilio.ts) should have
    // marked both delivered — proves the inbound webhook side works too,
    // not just outbound sending.
    await expect
      .poll(() => getSmsEventsForOrder(db, order.id).every((s) => s.status === "delivered"), { timeout: 3000 })
      .toBe(true);
  } finally {
    db.close();
  }
});

async function addItemToCart(page: import("@playwright/test").Page, itemName: string, spiceLevel: string) {
  const card = page.locator(".rounded-2xl.bg-white", {
    has: page.getByRole("heading", { name: itemName, exact: true }),
  });
  await card.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("heading", { name: itemName, level: 2 })).toBeVisible();
  await page.getByRole("button", { name: spiceLevel, exact: true }).click();
  await page.getByRole("button", { name: /Add to Cart/i }).click();
  await page.waitForTimeout(150);
}
