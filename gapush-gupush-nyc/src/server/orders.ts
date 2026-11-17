import crypto from "crypto";
import { query, withTransaction } from "./db";
import { getMenuItem, TAX_RATE } from "@/lib/menu-data";
import { EXTRA_PRICES } from "@/lib/cart";
import { reserveInventory, releaseInventory, SoldOutError } from "./inventory";
import { claimNextOrderNumber } from "./order-numbers";
import { createPaymentIntent } from "./mock-stripe";
import { sendSms } from "./mock-twilio";
import { CreateOrderInput, OrderDTO, OrderItemDTO, OrderStatus } from "./types";

export interface CreateOrderResult {
  order: OrderDTO;
  paymentIntent: { id: string; clientSecret: string; amountCents: number } | null;
}

export { SoldOutError };

export class OrderNotFoundError extends Error {
  constructor(id: string) {
    super(`Order ${id} not found`);
  }
}

export class InvalidTransitionError extends Error {
  constructor(public from: OrderStatus, public action: string) {
    super(`Cannot ${action} an order in status "${from}"`);
  }
}

// Single source of truth for the two customer-facing SMS bodies — these
// used to be copy-pasted at both call sites (pay-at-pickup's immediate
// send and the webhook-driven confirm), which is exactly the kind of
// thing that quietly drifts apart after one gets edited and the other
// doesn't. tests/order-flow.spec.ts asserts these exact strings.
const smsBody = {
  received: (orderNumber: string) =>
    `Gapush Gupush: We received order ${orderNumber}. We'll text you when it's ready.`,
  ready: (orderNumber: string) => `Gapush Gupush: Your order ${orderNumber} is READY for pickup!`,
};

/**
 * ---------------------------------------------------------------------------
 * ORDER STATE MACHINE (see CLAUDE.md for the diagram + full rationale)
 * ---------------------------------------------------------------------------
 *   pending_payment --(stripe: payment_intent.succeeded)--> confirmed
 *   pending_payment --(stripe: payment_intent.payment_failed)--> payment_failed
 *   confirmed        --(kitchen: accept)--> preparing
 *   preparing        --(kitchen: ready)--> ready
 *   ready            --(kitchen: complete)--> completed
 *
 * Pay-at-pickup orders skip straight to `confirmed` at creation (there is no
 * payment step to wait on). Every kitchen action below only succeeds as an
 * atomic `UPDATE ... WHERE status = <required-from-status>` — that single
 * statement is both the fix for "two kitchen devices tap the same button at
 * once" and for "kitchen marks an order ready before payment confirms": an
 * order sitting in pending_payment has no row matching `WHERE status =
 * 'preparing'`, so the attempt affects zero rows and is rejected with a 409,
 * not silently accepted.
 * ---------------------------------------------------------------------------
 */
const KITCHEN_TRANSITIONS: Record<string, { from: OrderStatus; to: OrderStatus }> = {
  accept: { from: "confirmed", to: "preparing" },
  ready: { from: "preparing", to: "ready" },
  complete: { from: "ready", to: "completed" },
};

function priceLine(item: CreateOrderInput["items"][number]) {
  const menuItem = getMenuItem(item.menuItemId);
  if (!menuItem) throw new Error(`Unknown menu item: ${item.menuItemId}`);
  const extrasCents =
    (item.extras.extraChili ? EXTRA_PRICES.extraChili : 0) +
    (item.extras.extraOnion ? EXTRA_PRICES.extraOnion : 0) +
    (item.extras.extraSauce ? EXTRA_PRICES.extraSauce : 0) +
    (item.extras.extraTamarind ? EXTRA_PRICES.extraTamarind : 0);
  const unitPriceCents = Math.round((menuItem.price + extrasCents) * 100);
  return {
    menuItem,
    unitPriceCents,
    lineTotalCents: unitPriceCents * item.quantity,
  };
}

/**
 * Creates an order. Prices are computed server-side from the menu (never
 * trusted from the client) and inventory is reserved atomically as part of
 * the same DB transaction as the order-number claim and the insert itself —
 * if any line is sold out, the whole transaction rolls back: no partial
 * order, no partially-decremented stock, no burned order number.
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  if (input.idempotencyKey) {
    const existing = await query<{ id: string }>("SELECT id FROM orders WHERE idempotency_key = $1", [
      input.idempotencyKey,
    ]);
    if (existing.length > 0) {
      // A retried checkout (see submitCheckoutWithRetry) whose earlier
      // attempt already landed — return the order that already exists
      // instead of charging/reserving stock a second time.
      const order = (await getOrder(existing[0].id))!;
      const intentRows =
        order.paymentMethod === "online" && order.paymentIntentId
          ? await query<{ id: string; amount_cents: number }>(
              "SELECT id, amount_cents FROM payment_intents WHERE id = $1",
              [order.paymentIntentId],
            )
          : [];
      const intent = intentRows[0];
      return {
        order,
        paymentIntent: intent
          ? { id: intent.id, clientSecret: `${intent.id}_secret_existing`, amountCents: intent.amount_cents }
          : null,
      };
    }
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  const priced = input.items.map((item) => ({ input: item, ...priceLine(item) }));
  const subtotalCents = priced.reduce((s, l) => s + l.lineTotalCents, 0);
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  const totalCents = subtotalCents + taxCents;
  const status: OrderStatus = input.paymentMethod === "pickup" ? "confirmed" : "pending_payment";

  const orderNumber = await withTransaction(async (client) => {
    const orderNumber = await claimNextOrderNumber(client);

    await reserveInventory(
      client,
      priced.map((l) => ({ menuItemId: l.menuItem.id, quantity: l.input.quantity })),
    );

    await client.query(
      `INSERT INTO orders
         (id, order_number, customer_name, phone, status, fulfillment, scheduled_time,
          payment_method, payment_intent_id, subtotal_cents, tax_cents, total_cents,
          created_at, updated_at, estimated_ready_at, is_demo, idempotency_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        id,
        orderNumber,
        input.customerName,
        input.phone,
        status,
        input.fulfillment,
        input.scheduledTime ?? null,
        input.paymentMethod,
        subtotalCents,
        taxCents,
        totalCents,
        now,
        now,
        now + 20 * 60 * 1000,
        input.isDemo ?? false,
        input.idempotencyKey ?? null,
      ],
    );

    for (const line of priced) {
      await client.query(
        `INSERT INTO order_items
           (id, order_id, menu_item_id, name, quantity, unit_price_cents, line_total_cents,
            spice_level, extras_json, instructions)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          crypto.randomUUID(),
          id,
          line.menuItem.id,
          line.menuItem.name,
          line.input.quantity,
          line.unitPriceCents,
          line.lineTotalCents,
          line.input.spiceLevel,
          JSON.stringify(line.input.extras),
          line.input.instructions ?? "",
        ],
      );
    }

    return orderNumber;
  });

  let paymentIntent: { id: string; clientSecret: string; amountCents: number } | null = null;
  if (input.paymentMethod === "online") {
    paymentIntent = await createPaymentIntent(id, totalCents);
    await query("UPDATE orders SET payment_intent_id = $1 WHERE id = $2", [paymentIntent.id, id]);
  } else {
    // Pay at pickup has nothing to wait on — it's confirmed the instant the
    // kitchen can see it, so the "order received" SMS fires right away.
    await sendSms(id, input.phone, smsBody.received(orderNumber), "order_received");
  }

  return { order: (await getOrder(id))!, paymentIntent };
}

/** Called when the Stripe webhook says a PaymentIntent succeeded. */
export async function confirmOrderPayment(paymentIntentId: string): Promise<void> {
  // One atomic UPDATE...WHERE status='pending_payment' closes the same
  // TOCTOU gap the inventory fix does: two "succeeded" events for the same
  // intent (a legitimate retry with a different event id, say) can't both
  // see status='pending_payment' and both fire a confirmation — only the
  // one whose UPDATE actually matches a row gets to send the SMS.
  const rows = await query<{ id: string; order_number: string; phone: string }>(
    `UPDATE orders SET status = 'confirmed', updated_at = $1
     WHERE payment_intent_id = $2 AND status = 'pending_payment'
     RETURNING id, order_number, phone`,
    [Date.now(), paymentIntentId],
  );
  const order = rows[0];
  if (!order) return; // Unknown intent, or already confirmed/failed — safe no-op.
  await sendSms(order.id, order.phone, smsBody.received(order.order_number), "order_received");
}

/** Called when the Stripe webhook says a PaymentIntent failed. */
export async function failOrderPayment(paymentIntentId: string, reason: string): Promise<void> {
  const rows = await query<{ id: string; order_number: string }>(
    `UPDATE orders SET status = 'payment_failed', updated_at = $1
     WHERE payment_intent_id = $2 AND status = 'pending_payment'
     RETURNING id, order_number`,
    [Date.now(), paymentIntentId],
  );
  const order = rows[0];
  if (!order) return;
  console.info(`payment failed for order ${order.order_number}: ${reason}`);

  const items = await query<{ menu_item_id: string; quantity: number }>(
    "SELECT menu_item_id, quantity FROM order_items WHERE order_id = $1",
    [order.id],
  );
  // Give the reserved stock back — a declined card must not permanently
  // hold inventory hostage.
  await withTransaction((client) =>
    releaseInventory(
      client,
      items.map((i) => ({ menuItemId: i.menu_item_id, quantity: i.quantity })),
    ),
  );
}

export async function applyKitchenAction(
  orderId: string,
  action: keyof typeof KITCHEN_TRANSITIONS,
): Promise<OrderDTO> {
  const transition = KITCHEN_TRANSITIONS[action];
  if (!transition) throw new Error(`Unknown kitchen action: ${action}`);

  const rows = await query(
    `UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3 AND status = $4 RETURNING id`,
    [transition.to, Date.now(), orderId, transition.from],
  );

  if (rows.length === 0) {
    // The UPDATE matched nothing — find out why, just to give a good error.
    // This lookup is NOT what makes the transition safe (the atomic UPDATE
    // above is); it only decides which error to throw.
    const existing = await query<{ status: OrderStatus }>("SELECT status FROM orders WHERE id = $1", [
      orderId,
    ]);
    if (existing.length === 0) throw new OrderNotFoundError(orderId);
    throw new InvalidTransitionError(existing[0].status, action);
  }

  const updated = (await getOrder(orderId))!;
  if (transition.to === "ready") {
    await sendSms(updated.id, updated.phone, smsBody.ready(updated.orderNumber), "order_ready");
  }
  return updated;
}

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  status: string;
  fulfillment: string;
  scheduled_time: string | null;
  payment_method: string;
  payment_intent_id: string | null;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  created_at: number;
  updated_at: number;
  estimated_ready_at: number;
  is_demo: boolean;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  menu_item_id: string;
  name: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  spice_level: string;
  extras_json: string;
  instructions: string;
}

function rowToDto(order: OrderRow, items: OrderItemRow[]): OrderDTO {
  return {
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    phone: order.phone,
    status: order.status as OrderStatus,
    fulfillment: order.fulfillment as OrderDTO["fulfillment"],
    scheduledTime: order.scheduled_time,
    paymentMethod: order.payment_method as OrderDTO["paymentMethod"],
    paymentIntentId: order.payment_intent_id,
    subtotalCents: order.subtotal_cents,
    taxCents: order.tax_cents,
    totalCents: order.total_cents,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    estimatedReadyAt: order.estimated_ready_at,
    isDemo: Boolean(order.is_demo),
    items: items.map(
      (item): OrderItemDTO => ({
        id: item.id,
        menuItemId: item.menu_item_id,
        name: item.name,
        quantity: item.quantity,
        unitPriceCents: item.unit_price_cents,
        lineTotalCents: item.line_total_cents,
        spiceLevel: item.spice_level,
        extras: JSON.parse(item.extras_json),
        instructions: item.instructions,
      }),
    ),
  };
}

export async function getOrder(id: string): Promise<OrderDTO | null> {
  const orders = await query<OrderRow>("SELECT * FROM orders WHERE id = $1", [id]);
  const order = orders[0];
  if (!order) return null;
  const items = await query<OrderItemRow>("SELECT * FROM order_items WHERE order_id = $1", [id]);
  return rowToDto(order, items);
}

export async function getOrderByNumber(orderNumber: string): Promise<OrderDTO | null> {
  const orders = await query<OrderRow>("SELECT * FROM orders WHERE order_number = $1", [orderNumber]);
  const order = orders[0];
  if (!order) return null;
  return getOrder(order.id);
}

export async function listOrders(): Promise<OrderDTO[]> {
  const orders = await query<OrderRow>("SELECT * FROM orders ORDER BY created_at DESC");
  const out: OrderDTO[] = [];
  for (const order of orders) {
    const items = await query<OrderItemRow>("SELECT * FROM order_items WHERE order_id = $1", [order.id]);
    out.push(rowToDto(order, items));
  }
  return out;
}

export interface CustomerSummary {
  phone: string;
  name: string;
  totalOrders: number;
  totalSpentCents: number;
  lastOrderAt: number;
  favoriteItem: string;
}

// A customer's stats only count orders that actually became real (paid or
// pay-at-pickup) — a declined card or an abandoned checkout should not make
// someone look like a repeat customer in the CRM.
const REALIZED_STATUSES: OrderStatus[] = ["confirmed", "preparing", "ready", "completed"];

export async function listCustomers(): Promise<CustomerSummary[]> {
  const orders = await query<OrderRow>(
    `SELECT * FROM orders WHERE status = ANY($1::text[]) ORDER BY created_at ASC`,
    [REALIZED_STATUSES],
  );

  const byPhone = new Map<
    string,
    { name: string; totalOrders: number; totalSpentCents: number; lastOrderAt: number; itemCounts: Map<string, number> }
  >();

  for (const order of orders) {
    const entry = byPhone.get(order.phone) ?? {
      name: order.customer_name,
      totalOrders: 0,
      totalSpentCents: 0,
      lastOrderAt: 0,
      itemCounts: new Map<string, number>(),
    };
    entry.name = order.customer_name;
    entry.totalOrders += 1;
    entry.totalSpentCents += order.total_cents;
    entry.lastOrderAt = Math.max(entry.lastOrderAt, order.created_at);
    const items = await query<{ name: string; quantity: number }>(
      "SELECT name, quantity FROM order_items WHERE order_id = $1",
      [order.id],
    );
    for (const item of items) {
      entry.itemCounts.set(item.name, (entry.itemCounts.get(item.name) ?? 0) + item.quantity);
    }
    byPhone.set(order.phone, entry);
  }

  return Array.from(byPhone.entries())
    .map(([phone, entry]) => {
      let favoriteItem = "—";
      let max = 0;
      for (const [name, qty] of entry.itemCounts) {
        if (qty > max) {
          max = qty;
          favoriteItem = name;
        }
      }
      return {
        phone,
        name: entry.name,
        totalOrders: entry.totalOrders,
        totalSpentCents: entry.totalSpentCents,
        lastOrderAt: entry.lastOrderAt,
        favoriteItem,
      };
    })
    .sort((a, b) => b.totalSpentCents - a.totalSpentCents);
}
