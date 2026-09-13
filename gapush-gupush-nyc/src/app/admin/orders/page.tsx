"use client";

import { useMemo, useState } from "react";
import { OrderCard } from "@/components/order/OrderCard";
import type { OrderDTO, OrderStatus } from "@/server/types";
import { usePolledOrders } from "@/lib/use-kitchen-orders";

const COLUMNS: { statuses: OrderStatus[]; label: string; icon: string; defaultShow: number; info?: boolean }[] = [
  {
    statuses: ["pending_payment", "payment_failed"],
    label: "Awaiting Payment",
    icon: "⏳",
    defaultShow: 10,
    info: true,
  },
  { statuses: ["confirmed"], label: "New", icon: "🆕", defaultShow: 20 },
  { statuses: ["preparing"], label: "Preparing", icon: "👨‍🍳", defaultShow: 20 },
  { statuses: ["ready"], label: "Ready", icon: "🥡", defaultShow: 20 },
  { statuses: ["completed"], label: "Completed", icon: "✅", defaultShow: 5 },
];

export default function OrderQueuePage() {
  const { orders, error, runAction } = usePolledOrders(3000);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    const map: Record<string, OrderDTO[]> = {};
    for (const col of COLUMNS) map[col.label] = [];
    for (const order of orders) {
      const col = COLUMNS.find((c) => c.statuses.includes(order.status));
      if (col) map[col.label].push(order);
    }
    return map;
  }, [orders]);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-brand-ink">Order Queue</h1>
      <p className="text-sm text-brand-ink/50">
        Advance orders through the kitchen — customers see updates instantly. The greyed-out column shows why an
        order isn&apos;t actionable yet.
      </p>
      {error && (
        <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">⚠️ {error}</p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
        {COLUMNS.map((col) => {
          const colOrders = grouped[col.label] ?? [];
          const isExpanded = expanded[col.label];
          const visible = isExpanded ? colOrders : colOrders.slice(0, col.defaultShow);
          return (
            <div key={col.label} className="min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">{col.icon}</span>
                <h2 className="font-bold text-brand-ink">{col.label}</h2>
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-bold text-brand-ink/50">
                  {colOrders.length}
                </span>
              </div>
              <div className="space-y-3">
                {visible.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-black/10 p-4 text-center text-xs text-brand-ink/40">
                    No orders here right now.
                  </p>
                )}
                {visible.map((order) => (
                  <OrderCard key={order.id} order={order} onAction={runAction} />
                ))}
                {colOrders.length > col.defaultShow && !isExpanded && (
                  <button
                    onClick={() => setExpanded((prev) => ({ ...prev, [col.label]: true }))}
                    className="w-full rounded-xl border border-black/10 bg-white py-2 text-xs font-bold text-brand-ink/60"
                  >
                    Show {colOrders.length - col.defaultShow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
