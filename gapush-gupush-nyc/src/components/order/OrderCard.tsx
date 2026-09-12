"use client";

import { Order, OrderStatus } from "@/lib/types";
import { formatCurrency, formatTime } from "@/lib/format";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/toast/ToastProvider";

const STATUS_BADGE: Record<OrderStatus, string> = {
  received: "bg-amber-100 text-amber-700",
  preparing: "bg-blue-100 text-blue-700",
  ready: "bg-emerald-100 text-emerald-700",
  completed: "bg-black/5 text-brand-ink/50",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  received: "New",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
};

const NEXT_ACTION: Partial<
  Record<OrderStatus, { label: string; next: OrderStatus }>
> = {
  received: { label: "Accept Order", next: "preparing" },
  preparing: { label: "Mark Ready", next: "ready" },
  ready: { label: "Mark Completed", next: "completed" },
};

export function OrderCard({ order }: { order: Order }) {
  const { setOrderStatus } = useApp();
  const { push } = useToast();
  const action = NEXT_ACTION[order.status];

  function handleAdvance() {
    if (!action) return;
    setOrderStatus(order.id, action.next);
    if (action.next === "preparing") {
      push({
        kind: "sms",
        title: `SMS to ${order.customerName}`,
        body: `Your order ${order.id} is now being prepared.`,
      });
    } else if (action.next === "ready") {
      push({
        kind: "sms",
        title: `SMS to ${order.customerName}`,
        body: `Your order ${order.id} is READY for pickup!`,
      });
    } else if (action.next === "completed") {
      push({
        kind: "success",
        title: `Order ${order.id} completed`,
        body: "Review request will follow in a moment.",
      });
    }
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-base font-bold text-brand-ink">{order.id}</p>
          <p className="text-sm font-semibold text-brand-ink/70">{order.customerName}</p>
          <p className="text-xs text-brand-ink/40">{order.phone}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_BADGE[order.status]}`}
        >
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      <ul className="mt-3 space-y-1 border-t border-black/5 pt-3 text-sm">
        {order.items.map((line) => (
          <li key={line.lineId} className="flex justify-between gap-2 text-brand-ink/70">
            <span className="truncate">
              {line.quantity}× {line.name}{" "}
              <span className="text-xs text-brand-ink/40">({line.spiceLevel})</span>
            </span>
            <span className="shrink-0 font-medium">{formatCurrency(line.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3 text-sm">
        <span className="text-brand-ink/50">
          Pickup ~{formatTime(order.estimatedReadyAt)}
        </span>
        <span className="font-display text-base font-extrabold text-brand-orange">
          {formatCurrency(order.total)}
        </span>
      </div>

      {action ? (
        <button
          onClick={handleAdvance}
          className="mt-3 w-full rounded-xl bg-brand-teal py-2.5 text-sm font-bold text-white active:scale-[0.98]"
        >
          {action.label}
        </button>
      ) : (
        <div className="mt-3 w-full rounded-xl bg-black/5 py-2.5 text-center text-sm font-semibold text-brand-ink/40">
          ✅ Completed
        </div>
      )}
    </div>
  );
}
