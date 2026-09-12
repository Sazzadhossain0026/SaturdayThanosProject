"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { OrderCard } from "@/components/order/OrderCard";
import { Order, OrderStatus } from "@/lib/types";

const COLUMNS: { status: OrderStatus; label: string; icon: string; defaultShow: number }[] = [
  { status: "received", label: "New", icon: "🆕", defaultShow: 20 },
  { status: "preparing", label: "Preparing", icon: "👨‍🍳", defaultShow: 20 },
  { status: "ready", label: "Ready", icon: "🥡", defaultShow: 20 },
  { status: "completed", label: "Completed", icon: "✅", defaultShow: 5 },
];

export default function OrderQueuePage() {
  const { state } = useApp();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const orders = state.orders;
  const grouped = useMemo(() => {
    const map: Record<OrderStatus, Order[]> = {
      received: [],
      preparing: [],
      ready: [],
      completed: [],
    };
    for (const order of orders) {
      map[order.status].push(order);
    }
    return map;
  }, [orders]);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-brand-ink">Order Queue</h1>
      <p className="text-sm text-brand-ink/50">
        Advance orders through the kitchen — customers see updates instantly.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const orders = grouped[col.status];
          const isExpanded = expanded[col.status];
          const visible = isExpanded ? orders : orders.slice(0, col.defaultShow);
          return (
            <div key={col.status} className="min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">{col.icon}</span>
                <h2 className="font-bold text-brand-ink">{col.label}</h2>
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-bold text-brand-ink/50">
                  {orders.length}
                </span>
              </div>
              <div className="space-y-3">
                {visible.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-black/10 p-4 text-center text-xs text-brand-ink/40">
                    No orders here right now.
                  </p>
                )}
                {visible.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
                {orders.length > col.defaultShow && !isExpanded && (
                  <button
                    onClick={() =>
                      setExpanded((prev) => ({ ...prev, [col.status]: true }))
                    }
                    className="w-full rounded-xl border border-black/10 bg-white py-2 text-xs font-bold text-brand-ink/60"
                  >
                    Show {orders.length - col.defaultShow} more
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
