import type { CreateOrderInput } from "@/server/types";

/**
 * All network access to the simulated backend goes through this file, so
 * the "bad connection" handling (timeouts, retry/backoff, idempotency) is
 * defined once instead of copy-pasted into every page.
 */

const PENDING_CHECKOUT_KEY = "gapush-pending-checkout-v1";
const REQUEST_TIMEOUT_MS = 8000;
const MAX_CHECKOUT_ATTEMPTS = 5;
const BACKOFF_BASE_MS = 1000;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/** A fetch failing to even complete (offline, DNS, timeout) vs. the server answering with an error. */
export class NetworkError extends Error {}

async function fetchJson<T>(url: string, init?: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    throw new NetworkError(err instanceof Error ? err.message : "network request failed");
  } finally {
    clearTimeout(timeout);
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status >= 500) {
      // Treat server errors as retryable-network-shaped failures for the
      // caller's purposes, same as a dropped connection.
      throw new NetworkError(body?.message ?? `server error (${res.status})`);
    }
    throw new ApiError(res.status, body?.error ?? "unknown", body?.message ?? "Request failed");
  }
  return body as T;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Checkout retry queue
// ---------------------------------------------------------------------------

export interface PendingCheckout {
  idempotencyKey: string;
  payload: CreateOrderInput;
  createdAt: number;
}

export function loadPendingCheckout(): PendingCheckout | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PENDING_CHECKOUT_KEY);
    return raw ? (JSON.parse(raw) as PendingCheckout) : null;
  } catch {
    return null;
  }
}

function savePendingCheckout(pending: PendingCheckout) {
  try {
    window.localStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(pending));
  } catch {
    /* best-effort — a full/blocked localStorage shouldn't break checkout */
  }
}

export function clearPendingCheckout() {
  try {
    window.localStorage.removeItem(PENDING_CHECKOUT_KEY);
  } catch {
    /* ignore */
  }
}

export type CheckoutProgress =
  | { phase: "submitting"; attempt: number }
  | { phase: "retrying"; attempt: number; nextDelayMs: number };

/**
 * Submits a checkout with automatic retry-with-backoff on network failure
 * (fetch timeout, connection drop, 5xx) — NOT on business errors like
 * validation or sold-out, which are the customer's problem to fix, not the
 * network's. Every attempt (including retries after a reload) carries the
 * same idempotencyKey, so a request that actually succeeded server-side but
 * whose response never made it back does not create a second order — see
 * createOrder()'s idempotency-key lookup in src/server/orders.ts.
 */
export async function submitCheckoutWithRetry(
  payload: CreateOrderInput,
  onProgress?: (progress: CheckoutProgress) => void,
  reuseIdempotencyKey?: string,
): Promise<{ order: import("@/server/types").OrderDTO; paymentIntent: { id: string; clientSecret: string; amountCents: number } | null }> {
  // Reuse the key from an earlier failed attempt if one is passed in (see
  // the "resume after reload" banner in the checkout page), but always send
  // the *current* form state — a customer who fixes a typo before retrying
  // should not have their edit silently discarded.
  const pending: PendingCheckout = {
    idempotencyKey: reuseIdempotencyKey ?? crypto.randomUUID(),
    payload,
    createdAt: Date.now(),
  };
  savePendingCheckout(pending);

  let attempt = 0;
  while (true) {
    attempt += 1;
    onProgress?.({ phase: "submitting", attempt });
    try {
      const result = await fetchJson<{
        order: import("@/server/types").OrderDTO;
        paymentIntent: { id: string; clientSecret: string; amountCents: number } | null;
      }>("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...pending.payload, idempotencyKey: pending.idempotencyKey }),
      });
      clearPendingCheckout();
      return result;
    } catch (err) {
      if (err instanceof ApiError) {
        // Sold out / validation — retrying won't help, surface immediately.
        clearPendingCheckout();
        throw err;
      }
      if (attempt >= MAX_CHECKOUT_ATTEMPTS) {
        // Deliberately KEEP the pending payload in localStorage: the order
        // may still be sitting on the server, or the customer may reopen
        // the app and want to try again with one tap instead of retyping
        // everything.
        throw err;
      }
      const delay = BACKOFF_BASE_MS * 2 ** (attempt - 1);
      onProgress?.({ phase: "retrying", attempt, nextDelayMs: delay });
      await sleep(delay);
    }
  }
}

/**
 * Resolves with { outcome: "succeed" } on an accepted test card. A declined
 * card comes back as an HTTP 402 and surfaces as a thrown ApiError (status
 * 402, message = the decline reason) — catch that rather than expecting a
 * "decline" value back.
 */
export async function confirmPayment(paymentIntentId: string, cardNumber: string, expiry: string, cvc: string) {
  return fetchJson<{ outcome: "succeed" }>("/api/checkout/confirm", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ paymentIntentId, cardNumber, expiry, cvc }),
  });
}

export async function fetchOrder(idOrNumber: string) {
  return fetchJson<{ order: import("@/server/types").OrderDTO }>(`/api/orders/${idOrNumber}`);
}

export async function fetchKitchenOrders() {
  return fetchJson<{ orders: import("@/server/types").OrderDTO[] }>("/api/kitchen/orders");
}

export async function runKitchenAction(orderId: string, action: "accept" | "ready" | "complete") {
  return fetchJson<{ order: import("@/server/types").OrderDTO }>(`/api/kitchen/orders/${orderId}/status`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action }),
  });
}

export async function fetchCustomers() {
  return fetchJson<{ customers: import("@/server/orders").CustomerSummary[] }>("/api/customers");
}

export async function fetchCateringLeads() {
  return fetchJson<{ leads: import("@/server/catering").CateringLeadDTO[] }>("/api/catering");
}

export async function submitCateringLead(input: import("@/server/catering").CateringLeadInput) {
  return fetchJson<{ lead: import("@/server/catering").CateringLeadDTO }>("/api/catering", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function fetchInventory() {
  return fetchJson<{ inventory: { menu_item_id: string; quantity_available: number; is_limited: number }[] }>(
    "/api/inventory",
  );
}
