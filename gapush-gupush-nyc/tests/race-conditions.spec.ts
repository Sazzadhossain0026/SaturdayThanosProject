import { test, expect } from "@playwright/test";
import { checkoutPayload, resetDemo } from "./helpers/api";
import { buildStripeSucceededEvent, signStripeEvent } from "./helpers/stripe";
import { getSmsEventsForOrder, openTestDb } from "./helpers/db";

/**
 * These tests exist because the task was explicitly: "audit the order flow
 * for race conditions ... list what breaks, then fix it." Each test proves
 * one specific failure mode from that audit is actually closed, against the
 * real HTTP API — not a unit test of the fix in isolation.
 */

test.describe("Race condition: two customers buying the last item", () => {
  test.beforeEach(async ({ request }) => {
    await resetDemo(request);
  });

  test("exactly stock-many concurrent checkouts succeed, the rest are told sold out", async ({ request }) => {
    // Seed stock for "naga-shingara" is 3 (see src/server/db.ts). Fire 5
    // simultaneous checkouts for 1 unit each — naive read-then-write
    // inventory code would let more than 3 through (see the bug writeup in
    // src/server/inventory.ts).
    const attempts = Array.from({ length: 5 }, (_, i) =>
      request.post("/api/checkout", {
        data: checkoutPayload({
          customerName: `Racer ${i}`,
          phone: `555000${i}`,
          items: [{ menuItemId: "naga-shingara", quantity: 1 }],
          paymentMethod: "pickup",
        }),
      }),
    );

    const responses = await Promise.all(attempts);
    const statuses = responses.map((r) => r.status()).sort();
    const succeeded = statuses.filter((s) => s === 201).length;
    const soldOut = statuses.filter((s) => s === 409).length;

    expect(succeeded, "exactly the units in stock should succeed").toBe(3);
    expect(soldOut, "the rest should be told sold out, not overbooked").toBe(2);

    const inventoryRes = await request.get("/api/inventory");
    const { inventory } = await inventoryRes.json();
    const naga = inventory.find((i: { menu_item_id: string }) => i.menu_item_id === "naga-shingara");
    expect(naga.quantity_available, "stock should land at exactly zero, never negative").toBe(0);
  });

  test("a retried checkout with the same idempotency key does not double-reserve stock", async ({ request }) => {
    // This is the flip side of the bug above: a customer's flaky
    // connection causing the client to *retry* a checkout it already sent
    // must not look like a second customer to the server.
    const key = `idem-test-${Date.now()}`;
    const payload = checkoutPayload({
      customerName: "Flaky Connection",
      phone: "5551112222",
      items: [{ menuItemId: "naga-shingara", quantity: 2 }],
      paymentMethod: "pickup",
      idempotencyKey: key,
    });

    const first = await request.post("/api/checkout", { data: payload });
    expect(first.status()).toBe(201);
    const firstBody = await first.json();

    const second = await request.post("/api/checkout", { data: payload });
    expect(second.status()).toBe(201);
    const secondBody = await second.json();

    expect(secondBody.order.id, "the retry should return the SAME order, not create a new one").toBe(
      firstBody.order.id,
    );

    const inventoryRes = await request.get("/api/inventory");
    const { inventory } = await inventoryRes.json();
    const naga = inventory.find((i: { menu_item_id: string }) => i.menu_item_id === "naga-shingara");
    expect(naga.quantity_available, "stock should only be debited once, not twice").toBe(1);
  });
});

test.describe("Race condition: a Stripe webhook arriving twice", () => {
  test.beforeEach(async ({ request }) => {
    await resetDemo(request);
  });

  test("a duplicate webhook delivery does not double-confirm the order or double-send SMS", async ({ request }) => {
    const checkoutRes = await request.post("/api/checkout", {
      data: checkoutPayload({
        customerName: "Webhook Dup",
        phone: "5553334444",
        items: [{ menuItemId: "cha", quantity: 1 }],
        paymentMethod: "online",
      }),
    });
    expect(checkoutRes.status()).toBe(201);
    const { order, paymentIntent } = await checkoutRes.json();
    expect(order.status).toBe("pending_payment");

    const eventId = `evt_dup_test_${Date.now()}`;
    const event = buildStripeSucceededEvent(paymentIntent.id, eventId);
    const rawBody = JSON.stringify(event);
    const signature = signStripeEvent(rawBody);

    const post = () =>
      request.post("/api/webhooks/stripe", {
        data: rawBody,
        headers: { "content-type": "application/json", "stripe-signature": signature },
      });

    const first = await post();
    expect(first.status()).toBe(200);
    expect((await first.json()).duplicate).toBe(false);

    const second = await post();
    expect(second.status()).toBe(200);
    expect((await second.json()).duplicate, "the second identical delivery must be recognized as a duplicate").toBe(
      true,
    );

    const orderRes = await request.get(`/api/orders/${order.id}`);
    const { order: finalOrder } = await orderRes.json();
    expect(finalOrder.status).toBe("confirmed");

    const db = openTestDb();
    try {
      const smsEvents = getSmsEventsForOrder(db, order.id);
      const receivedSms = smsEvents.filter((e) => e.kind === "order_received");
      expect(receivedSms, "exactly one SMS should have gone out despite two webhook deliveries").toHaveLength(1);
      expect(receivedSms[0].body).toBe(`Gapush Gupush: We received order ${order.orderNumber}. We'll text you when it's ready.`);
    } finally {
      db.close();
    }
  });

  test("an invalid webhook signature is rejected outright", async ({ request }) => {
    const rawBody = JSON.stringify(buildStripeSucceededEvent("pi_fake", "evt_fake"));
    const res = await request.post("/api/webhooks/stripe", {
      data: rawBody,
      headers: { "content-type": "application/json", "stripe-signature": "t=1,v1=deadbeef" },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe("Race condition: kitchen marks an order ready before payment confirms", () => {
  test.beforeEach(async ({ request }) => {
    await resetDemo(request);
  });

  test("ready/accept are rejected while the order is still pending_payment", async ({ request }) => {
    const checkoutRes = await request.post("/api/checkout", {
      data: checkoutPayload({
        customerName: "Impatient Kitchen",
        phone: "5559990000",
        items: [{ menuItemId: "fuchka", quantity: 1 }],
        paymentMethod: "online",
      }),
    });
    const { order } = await checkoutRes.json();
    expect(order.status).toBe("pending_payment");

    const readyAttempt = await request.post(`/api/kitchen/orders/${order.id}/status`, {
      data: { action: "ready" },
    });
    expect(readyAttempt.status(), "jumping straight to ready before payment must be rejected").toBe(409);
    const readyBody = await readyAttempt.json();
    expect(readyBody.currentStatus).toBe("pending_payment");

    const acceptAttempt = await request.post(`/api/kitchen/orders/${order.id}/status`, {
      data: { action: "accept" },
    });
    expect(acceptAttempt.status(), "accepting before payment must also be rejected").toBe(409);

    // Confirm it the right way (on a fresh order, to keep this test's
    // failure/success cases independent), then prove the same action now
    // succeeds — the guard is about ordering, not a permanent block.
    const checkoutBody = await (
      await request.post("/api/checkout", {
        data: checkoutPayload({
          customerName: "Impatient Kitchen 2",
          phone: "5559990001",
          items: [{ menuItemId: "fuchka", quantity: 1 }],
          paymentMethod: "online",
        }),
      })
    ).json();
    const signedEvent = buildStripeSucceededEvent(checkoutBody.paymentIntent.id, `evt_confirm2_${Date.now()}`);
    const rawBody = JSON.stringify(signedEvent);
    await request.post("/api/webhooks/stripe", {
      data: rawBody,
      headers: { "content-type": "application/json", "stripe-signature": signStripeEvent(rawBody) },
    });

    const acceptNow = await request.post(`/api/kitchen/orders/${checkoutBody.order.id}/status`, {
      data: { action: "accept" },
    });
    expect(acceptNow.status(), "once actually paid, the same action should succeed").toBe(200);
  });
});
