import crypto from "crypto";
import { db } from "./db";
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
 * payment step to wait on). Every kitchen action below is only legal from
 * one specific prior status — that table (KITCHEN_TRANSITIONS) is the fix
 * for "kitchen marks an order ready before payment confirms": an order
 * sitting in pending_payment has no valid `ready` transition, so the attempt
 * is rejected with a 409, not silently accepted.
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
 * the same DB transaction — if any line is sold out, nothing is written:
 * no partial order, no partially-decremented stock.
 */
export function createOrder(input: CreateOrderInput): CreateOrderResult {
  if (input.idempotencyKey) {
    const existing = db
      .prepare("SELECT id FROM orders WHERE idempotency_key = ?")
      .get(input.idempotencyKey) as { id: string } | undefined;
    if (existing) {
      // A retried checkout (see submitCheckoutWithRetry) whose earlier
      // attempt already landed — return the order that already exists
      // instead of charging/reserving stock a second time.
      const order = getOrder(existing.id)!;
      const intent =
        order.paymentMethod === "online" && order.paymentIntentId
          ? (db
              .prepare("SELECT id, amount_cents FROM payment_intents WHERE id = ?")
              .get(order.paymentIntentId) as { id: string; amount_cents: number } | undefined)
          : undefined;
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
  const orderNumber = claimNextOrderNumber();

  const run = db.transaction(() => {
    reserveInventory(priced.map((l) => ({ menuItemId: l.menuItem.id, quantity: l.input.quantity })));

    db.prepare(
      `INSERT INTO orders
         (id, order_number, customer_name, phone, status, fulfillment, scheduled_time,
          payment_method, payment_intent_id, subtotal_cents, tax_cents, total_cents,
          created_at, updated_at, estimated_ready_at, is_demo, idempotency_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
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
      input.isDemo ? 1 : 0,
      input.idempotencyKey ?? null,
    );

    const insertItem = db.prepare(
      `INSERT INTO order_items
         (id, order_id, menu_item_id, name, quantity, unit_price_cents, line_total_cents,
          spice_level, extras_json, instructions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const line of priced) {
      insertItem.run(
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
      );
    }
  });
  run();

  let paymentIntent: { id: string; clientSecret: string; amountCents: number } | null = null;
  if (input.paymentMethod === "online") {
    paymentIntent = createPaymentIntent(id, totalCents);
    db.prepare("UPDATE orders SET payment_intent_id = ? WHERE id = ?").run(paymentIntent.id, id);
  } else {
    // Pay at pickup has nothing to wait on — it's confirmed the instant the
    // kitchen can see it, so the "order received" SMS fires right away.
    sendSms(id, input.phone, smsBody.received(orderNumber), "order_received");
  }

  return { order: getOrder(id)!, paymentIntent };
}

/** Called when the Stripe webhook says a PaymentIntent succeeded. */
export function confirmOrderPayment(paymentIntentId: string): void {
  const order = db
    .prepare("SELECT * FROM orders WHERE payment_intent_id = ?")
    .get(paymentIntentId) as OrderRow | undefined;
  if (!order) return; // Unknown intent — nothing to do, but don't throw: webhooks must 200.
  if (order.status !== "pending_payment") {
    // Already confirmed (or already failed) — this is what makes a second,
    // duplicate "succeeded" delivery a safe no-op instead of a double SMS.
    return;
  }
  db.prepare("UPDATE orders SET status = 'confirmed', updated_at = ? WHERE id = ?").run(Date.now(), order.id);
  sendSms(order.id, order.phone, smsBody.received(order.order_number), "order_received");
}

/** Called when the Stripe webhook says a PaymentIntent failed. */
export function failOrderPayment(paymentIntentId: string, reason: string): void {
  const order = db
    .prepare("SELECT * FROM orders WHERE payment_intent_id = ?")
    .get(paymentIntentId) as OrderRow | undefined;
  if (!order) return;
  if (order.status !== "pending_payment") return;
  console.info(`payment failed for order ${order.order_number}: ${reason}`);

  const items = db
    .prepare("SELECT menu_item_id, quantity FROM order_items WHERE order_id = ?")
    .all(order.id) as { menu_item_id: string; quantity: number }[];

  const run = db.transaction(() => {
    db.prepare("UPDATE orders SET status = 'payment_failed', updated_at = ? WHERE id = ?").run(
      Date.now(),
      order.id,
    );
    // Give the reserved stock back — a declined card must not permanently
    // hold inventory hostage.
    releaseInventory(items.map((i) => ({ menuItemId: i.menu_item_id, quantity: i.quantity })));
  });
  run();
}

export function applyKitchenAction(orderId: string, action: keyof typeof KITCHEN_TRANSITIONS): OrderDTO {
  const transition = KITCHEN_TRANSITIONS[action];
  if (!transition) throw new Error(`Unknown kitchen action: ${action}`);

  const run = db.transaction(() => {
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as OrderRow | undefined;
    if (!order) throw new OrderNotFoundError(orderId);
    if (order.status !== transition.from) {
      throw new InvalidTransitionError(order.status as OrderStatus, action);
    }
    db.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?").run(
      transition.to,
      Date.now(),
      orderId,
    );
  });
  run();

  const updated = getOrder(orderId)!;
  if (transition.to === "ready") {
    sendSms(updated.id, updated.phone, smsBody.ready(updated.orderNumber), "order_ready");
  }
  return getOrder(orderId)!;
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
  is_demo: number;
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

export function getOrder(id: string): OrderDTO | null {
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as OrderRow | undefined;
  if (!order) return null;
  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id) as OrderItemRow[];
  return rowToDto(order, items);
}

export function getOrderByNumber(orderNumber: string): OrderDTO | null {
  const order = db.prepare("SELECT * FROM orders WHERE order_number = ?").get(orderNumber) as
    | OrderRow
    | undefined;
  if (!order) return null;
  return getOrder(order.id);
}

export function listOrders(): OrderDTO[] {
  const orders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all() as OrderRow[];
  const itemStmt = db.prepare("SELECT * FROM order_items WHERE order_id = ?");
  return orders.map((order) => rowToDto(order, itemStmt.all(order.id) as OrderItemRow[]));
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

export function listCustomers(): CustomerSummary[] {
  const placeholders = REALIZED_STATUSES.map(() => "?").join(",");
  const orders = db
    .prepare(`SELECT * FROM orders WHERE status IN (${placeholders}) ORDER BY created_at ASC`)
    .all(...REALIZED_STATUSES) as OrderRow[];

  const byPhone = new Map<
    string,
    { name: string; totalOrders: number; totalSpentCents: number; lastOrderAt: number; itemCounts: Map<string, number> }
  >();
  const itemStmt = db.prepare("SELECT name, quantity FROM order_items WHERE order_id = ?");

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
    for (const item of itemStmt.all(order.id) as { name: string; quantity: number }[]) {
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
