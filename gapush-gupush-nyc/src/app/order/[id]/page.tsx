"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/toast/ToastProvider";
import { OrderStatusTracker } from "@/components/order/OrderStatusTracker";
import { formatCurrency, formatTime } from "@/lib/format";
import { extrasLabelList } from "@/lib/cart";

export default function OrderTrackingPage() {
  const params = useParams<{ id: string }>();
  const { getOrder, markReviewRequested } = useApp();
  const { push } = useToast();
  const order = getOrder(params.id);
  const [reviewShown, setReviewShown] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!order) return;
    if (order.status === "completed" && !order.reviewRequested && !reviewShown) {
      timerRef.current = window.setTimeout(() => {
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
        markReviewRequested(order.id);
        setReviewShown(true);
      }, 2000);
    }
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.status]);

  if (!order) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
        <span className="text-5xl">🔎</span>
        <h1 className="font-display mt-4 text-2xl font-extrabold text-brand-ink">
          Order not found
        </h1>
        <p className="mt-2 text-sm text-brand-ink/50">
          We couldn&apos;t find order {params.id}. It may have been cleared by a demo reset.
        </p>
        <Link
          href="/menu"
          className="mt-6 rounded-2xl bg-brand-orange px-6 py-3 font-bold text-white active:scale-95"
        >
          Start a New Order
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pt-6 pb-20">
      <section className="rounded-3xl bg-gradient-to-br from-emerald-50 to-white p-6 text-center shadow-sm ring-1 ring-black/5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-3xl text-white shadow-md">
          ✓
        </div>
        <h1 className="font-display mt-4 text-2xl font-extrabold text-brand-ink">
          Order Confirmed!
        </h1>
        <p className="mt-1 text-sm text-brand-ink/60">
          Thanks, <span className="font-bold text-brand-ink">{order.customerName}</span> —
          we&apos;ve got your order.
        </p>
        <p className="font-display mt-3 text-3xl font-extrabold tracking-wide text-brand-orange">
          {order.id}
        </p>
        <a
          href="#tracker"
          className="mt-4 inline-block rounded-full bg-brand-teal px-5 py-2.5 text-sm font-bold text-white active:scale-95"
        >
          Track My Order ↓
        </a>
      </section>

      <section id="tracker" className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-brand-ink">Order Status</h2>
          <span className="text-xs font-semibold text-brand-ink/50">
            Est. ready {formatTime(order.estimatedReadyAt)}
          </span>
        </div>
        <div className="mt-5">
          <OrderStatusTracker status={order.status} />
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="text-sm font-bold text-brand-ink">Order Details</h2>
        <ul className="mt-3 space-y-3 border-b border-black/5 pb-3">
          {order.items.map((line) => (
            <li key={line.lineId} className="flex gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-xl ${line.gradient}`}
              >
                {line.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <p className="text-sm font-semibold text-brand-ink">
                    {line.quantity}× {line.name}
                  </p>
                  <p className="shrink-0 text-sm font-bold text-brand-ink">
                    {formatCurrency(line.lineTotal)}
                  </p>
                </div>
                <p className="text-xs text-brand-ink/50">
                  {line.spiceLevel} spice
                  {extrasLabelList(line.extras).length > 0 &&
                    ` · ${extrasLabelList(line.extras).join(", ")}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="space-y-1 pt-3 text-sm">
          <div className="flex justify-between text-brand-ink/60">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-brand-ink/60">
            <span>Tax</span>
            <span>{formatCurrency(order.tax)}</span>
          </div>
          <div className="flex justify-between text-base font-extrabold text-brand-ink">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
          <div className="flex justify-between pt-2 text-xs text-brand-ink/40">
            <span>Payment</span>
            <span className="font-semibold">
              {order.paymentMethod === "online" ? "Paid Online (demo)" : "Pay at Pickup"}
            </span>
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
