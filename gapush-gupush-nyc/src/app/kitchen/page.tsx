"use client";

import { useMemo } from "react";
import Link from "next/link";
import { OrderCard } from "@/components/order/OrderCard";
import type { OrderDTO, OrderStatus } from "@/server/types";
import { usePolledOrders } from "@/lib/use-kitchen-orders";

/**
 * Standalone kitchen-facing view — a phone or tablet propped up by the
 * grill, not the owner's dashboard. Same API as /admin/orders
 * (usePolledOrders + OrderCard + the same accept/ready/complete actions),
 * just a simpler, single-purpose screen: no sales numbers, no nav chrome,
 * big tap targets, and a live count so staff can tell at a glance the
 * screen isn't frozen.
 */
const COLUMNS: { status: OrderStatus; label: string; icon: string }[] = [
  { status: "confirmed", label: "New", icon: "🆕" },
  { status: "preparing", label: "Preparing", icon: "👨‍🍳" },
  { status: "ready", label: "Ready", icon: "🥡" },
];

export default function KitchenViewPage() {
  const { orders, loading, error, runAction } = usePolledOrders(2500);

  const grouped = useMemo(() => {
    const map: Record<OrderStatus, OrderDTO[]> = {
      pending_payment: [],
      payment_failed: [],
      confirmed: [],
      preparing: [],
      ready: [],
      completed: [],
      cancelled: [],
    };
    for (const order of orders) map[order.status].push(order);
    return map;
  }, [orders]);

  const awaitingPayment = grouped.pending_payment.length;
  const completedToday = grouped.completed.length;

  return (
    <div className="min-h-screen bg-[#f4f2ee] pb-10">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-brand-teal px-4 py-4 text-white">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-orange text-lg">🍳</span>
          <div>
            <p className="font-display text-sm leading-none font-extrabold">Kitchen View</p>
            <p className="text-[10px] tracking-widest text-white/60 uppercase">Gapush Gupush NYC</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/70">
          <span>{completedToday} done today</span>
          <Link href="/admin" className="rounded-full bg-white/10 px-3 py-1.5 font-semibold text-white">
            Owner View
          </Link>
        </div>
      </header>

      <div className="px-4 pt-4">
        {error && (
          <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
            ⚠️ {error} — retrying automatically.
          </p>
        )}
        {awaitingPayment > 0 && (
          <p className="mb-3 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
            {awaitingPayment} order{awaitingPayment > 1 ? "s" : ""} waiting on payment confirmation — they&apos;ll
            appear here the moment they&apos;re paid.
          </p>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {COLUMNS.map((col) => {
            const colOrders = grouped[col.status];
            return (
              <div key={col.status}>
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xl">{col.icon}</span>
                  <h2 className="font-display text-lg font-bold text-brand-ink">{col.label}</h2>
                  <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-sm font-bold text-brand-ink/50">
                    {colOrders.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {!loading && colOrders.length === 0 && (
                    <p className="rounded-2xl border border-dashed border-black/10 bg-white/60 p-6 text-center text-sm text-brand-ink/40">
                      Nothing here.
                    </p>
                  )}
                  {colOrders.map((order) => (
                    <OrderCard key={order.id} order={order} onAction={runAction} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
