"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useToast } from "@/components/toast/ToastProvider";
import { OrderStatusTracker } from "@/components/order/OrderStatusTracker";
import { formatCurrency, formatTime } from "@/lib/format";
import { ApiError, fetchOrder } from "@/lib/api-client";
import type { OrderDTO } from "@/server/types";

const PENDING_POLL_MS = 1500;
const NORMAL_POLL_MS = 4000;
// If a Stripe webhook hasn't confirmed the payment within this long, stop
// optimistically saying "confirming" and admit something's wrong instead —
// this is the "clear error state if the order doesn't confirm" requirement.
const CONFIRM_TIMEOUT_MS = 15000;

export default function OrderTrackingPage() {
  const params = useParams<{ id: string }>();
  const { push } = useToast();
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [connectionIssue, setConnectionIssue] = useState(false);
  const [confirmTimedOut, setConfirmTimedOut] = useState(false);
  const reviewShownRef = useRef(false);
  const pendingSinceRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number;

    async function poll() {
      try {
        const { order: fresh } = await fetchOrder(params.id);
        if (cancelled) return;
        setOrder(fresh);
        setConnectionIssue(false);
        setNotFound(false);

        if (fresh.status === "pending_payment") {
          if (pendingSinceRef.current === null) pendingSinceRef.current = Date.now();
          const elapsed = Date.now() - pendingSinceRef.current;
          setConfirmTimedOut(elapsed > CONFIRM_TIMEOUT_MS);
        } else {
          pendingSinceRef.current = null;
          setConfirmTimedOut(false);
        }

        // Fire the review-request flow once, client-side, when we observe
        // the transition into "completed" — matches the original
        // "wait 2s after completion" behavior, now driven by real polling
        // instead of a local store update.
        if (fresh.status === "completed" && !reviewShownRef.current) {
          reviewShownRef.current = true;
          window.setTimeout(() => {
            push({
              kind: "review",
              title: "Thanks for ordering from Gapush Gupush!",
              body: "If you enjoyed your food, we'd love your feedback.",
              actionLabel: "Leave a Google Review",
              onAction: () =>
                push({
                  kind: "success",
                  title: "Thanks for the love! 💛",
                  body: "In the full product, this opens your Google Business review page.",
                }),
            });
          }, 2000);
        }

        const interval = fresh.status === "pending_payment" ? PENDING_POLL_MS : NORMAL_POLL_MS;
        if (fresh.status !== "completed" && fresh.status !== "cancelled") {
          timeoutId = window.setTimeout(poll, interval);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
          return;
        }
        // Network blip — keep showing the last good order, surface a small
        // banner, and keep trying rather than tearing down the page.
        setConnectionIssue(true);
        timeoutId = window.setTimeout(poll, NORMAL_POLL_MS);
      }
    }

    poll();
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [params.id, push]);

  if (notFound) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
        <span className="text-5xl">🔎</span>
        <h1 className="font-display mt-4 text-2xl font-extrabold text-brand-ink">Order not found</h1>
        <p className="mt-2 text-sm text-brand-ink/50">
          We couldn&apos;t find order {params.id}. It may have been cleared by a demo reset.
        </p>
        <Link href="/menu" className="mt-6 rounded-2xl bg-brand-orange px-6 py-3 font-bold text-white active:scale-95">
          Start a New Order
        </Link>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
        <p className="mt-4 text-sm text-brand-ink/50">Loading your order…</p>
      </main>
    );
  }

  const isPending = order.status === "pending_payment";
  const isFailed = order.status === "payment_failed";

  return (
    <main className="mx-auto max-w-2xl px-4 pt-6 pb-20">
      {connectionIssue && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-700">
          ⚠️ Having trouble getting live updates — showing the last status we saw.
        </div>
      )}

      {isFailed ? (
        <section className="rounded-3xl bg-gradient-to-br from-red-50 to-white p-6 text-center shadow-sm ring-1 ring-black/5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-3xl text-white shadow-md">
            ✕
          </div>
          <h1 className="font-display mt-4 text-2xl font-extrabold text-brand-ink">Payment didn&apos;t go through</h1>
          <p className="mt-1 text-sm text-brand-ink/60">
            Order {order.orderNumber} was not charged and your items were released back to inventory.
          </p>
          <Link href="/menu" className="mt-4 inline-block rounded-full bg-brand-orange px-5 py-2.5 text-sm font-bold text-white">
            Try Again
          </Link>
        </section>
      ) : isPending && confirmTimedOut ? (
        <section className="rounded-3xl bg-gradient-to-br from-amber-50 to-white p-6 text-center shadow-sm ring-1 ring-black/5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-3xl text-white shadow-md">
            !
          </div>
          <h1 className="font-display mt-4 text-2xl font-extrabold text-brand-ink">Still confirming your payment</h1>
          <p className="mt-2 text-sm text-brand-ink/60">
            This is taking longer than it should. If your card was charged, don&apos;t worry — order{" "}
            <span className="font-bold">{order.orderNumber}</span> is safely on file and we&apos;ll sort it out. You
            can keep waiting or check back in a minute.
          </p>
          <button
            onClick={() => {
              pendingSinceRef.current = Date.now();
              setConfirmTimedOut(false);
            }}
            className="mt-4 rounded-full bg-brand-teal px-5 py-2.5 text-sm font-bold text-white active:scale-95"
          >
            Keep Checking
          </button>
        </section>
      ) : isPending ? (
        <section className="rounded-3xl bg-gradient-to-br from-orange-50 to-white p-6 text-center shadow-sm ring-1 ring-black/5">
          <span className="mx-auto block h-14 w-14 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
          <h1 className="font-display mt-4 text-2xl font-extrabold text-brand-ink">Confirming your payment…</h1>
          <p className="mt-1 text-sm text-brand-ink/60">
            Order <span className="font-bold">{order.orderNumber}</span> is on its way — this usually takes a second.
          </p>
        </section>
      ) : (
        <section className="rounded-3xl bg-gradient-to-br from-emerald-50 to-white p-6 text-center shadow-sm ring-1 ring-black/5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-3xl text-white shadow-md">
            ✓
          </div>
          <h1 className="font-display mt-4 text-2xl font-extrabold text-brand-ink">Order Confirmed!</h1>
          <p className="mt-1 text-sm text-brand-ink/60">
            Thanks, <span className="font-bold text-brand-ink">{order.customerName}</span> — we&apos;ve got your
            order.
          </p>
          <p className="font-display mt-3 text-3xl font-extrabold tracking-wide text-brand-orange">
            {order.orderNumber}
          </p>
          <a
            href="#tracker"
            className="mt-4 inline-block rounded-full bg-brand-teal px-5 py-2.5 text-sm font-bold text-white active:scale-95"
          >
            Track My Order ↓
          </a>
        </section>
      )}

      <section id="tracker" className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-brand-ink">Order Status</h2>
          <span className="text-xs font-semibold text-brand-ink/50">Est. ready {formatTime(order.estimatedReadyAt)}</span>
        </div>
        <div className="mt-5">
          <OrderStatusTracker status={order.status} />
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="text-sm font-bold text-brand-ink">Order Details</h2>
        <ul className="mt-3 space-y-3 border-b border-black/5 pb-3">
          {order.items.map((line) => (
            <li key={line.id} className="flex gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-orange/60 to-brand-orange text-xl text-white">
                🍽️
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <p className="text-sm font-semibold text-brand-ink">
                    {line.quantity}× {line.name}
                  </p>
                  <p className="shrink-0 text-sm font-bold text-brand-ink">{formatCurrency(line.lineTotalCents / 100)}</p>
                </div>
                <p className="text-xs text-brand-ink/50">
                  {line.spiceLevel} spice
                  {extrasLabels(line.extras).length > 0 && ` · ${extrasLabels(line.extras).join(", ")}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="space-y-1 pt-3 text-sm">
          <div className="flex justify-between text-brand-ink/60">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotalCents / 100)}</span>
          </div>
          <div className="flex justify-between text-brand-ink/60">
            <span>Tax</span>
            <span>{formatCurrency(order.taxCents / 100)}</span>
          </div>
          <div className="flex justify-between text-base font-extrabold text-brand-ink">
            <span>Total</span>
            <span>{formatCurrency(order.totalCents / 100)}</span>
          </div>
          <div className="flex justify-between pt-2 text-xs text-brand-ink/40">
            <span>Payment</span>
            <span className="font-semibold">{order.paymentMethod === "online" ? "Paid Online (demo)" : "Pay at Pickup"}</span>
          </div>
        </div>
      </section>

      <div className="mt-6 text-center">
        <Link href="/menu" className="text-sm font-bold text-brand-teal">
          ← Order something else
        </Link>
      </div>
    </main>
  );
}

function extrasLabels(extras: OrderDTO["items"][number]["extras"]): string[] {
  const labels: string[] = [];
  if (extras.extraChili) labels.push("Extra Chili");
  if (extras.extraOnion) labels.push("Extra Onion");
  if (extras.extraSauce) labels.push("Extra Sauce");
  if (extras.extraTamarind) labels.push("Extra Tamarind Sauce");
  return labels;
}
