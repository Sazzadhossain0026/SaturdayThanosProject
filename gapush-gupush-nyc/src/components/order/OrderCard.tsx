"use client";

import { useState } from "react";
import type { OrderDTO, OrderStatus } from "@/server/types";
import { formatCurrency, formatTime } from "@/lib/format";
import { ApiError } from "@/lib/api-client";
import { useToast } from "@/components/toast/ToastProvider";

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending_payment: "bg-slate-100 text-slate-500",
  payment_failed: "bg-red-100 text-red-600",
  confirmed: "bg-amber-100 text-amber-700",
  preparing: "bg-blue-100 text-blue-700",
  ready: "bg-emerald-100 text-emerald-700",
  completed: "bg-black/5 text-brand-ink/50",
  cancelled: "bg-black/5 text-brand-ink/40",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Awaiting Payment",
  payment_failed: "Payment Failed",
  confirmed: "New",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; action: "accept" | "ready" | "complete" }>> = {
  confirmed: { label: "Accept Order", action: "accept" },
  preparing: { label: "Mark Ready", action: "ready" },
  ready: { label: "Mark Completed", action: "complete" },
};

export function OrderCard({
  order,
  onAction,
}: {
  order: OrderDTO;
  onAction: (orderId: string, action: "accept" | "ready" | "complete") => Promise<unknown>;
}) {
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const action = NEXT_ACTION[order.status];
  const notActionable = order.status === "pending_payment" || order.status === "payment_failed";

  async function handleAdvance() {
    if (!action || busy) return;
    setBusy(true);
    try {
      await onAction(order.id, action.action);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Someone else on the kitchen tablet already tapped this, or the
        // order isn't paid yet — this is the guard working, not a bug.
        push({ kind: "info", title: "Order already moved on", body: err.message });
      } else {
        push({ kind: "info", title: "Couldn't update order", body: "Check your connection and try again." });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 ${notActionable ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-base font-bold text-brand-ink">{order.orderNumber}</p>
          <p className="text-sm font-semibold text-brand-ink/70">{order.customerName}</p>
          <p className="text-xs text-brand-ink/40">{order.phone}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_BADGE[order.status]}`}>
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      <ul className="mt-3 space-y-1 border-t border-black/5 pt-3 text-sm">
        {order.items.map((line) => (
          <li key={line.id} className="flex justify-between gap-2 text-brand-ink/70">
            <span className="truncate">
              {line.quantity}× {line.name} <span className="text-xs text-brand-ink/40">({line.spiceLevel})</span>
            </span>
            <span className="shrink-0 font-medium">{formatCurrency(line.lineTotalCents / 100)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3 text-sm">
        <span className="text-brand-ink/50">Pickup ~{formatTime(order.estimatedReadyAt)}</span>
        <span className="font-display text-base font-extrabold text-brand-orange">
          {formatCurrency(order.totalCents / 100)}
        </span>
      </div>

      {notActionable ? (
        <div className="mt-3 w-full rounded-xl bg-black/5 py-2.5 text-center text-xs font-semibold text-brand-ink/40">
          {order.status === "pending_payment"
            ? "Waiting on payment confirmation — not visible to kitchen until paid."
            : "Card declined — customer needs to retry checkout."}
        </div>
      ) : action ? (
        <button
          onClick={handleAdvance}
          disabled={busy}
          className="mt-3 w-full rounded-xl bg-brand-teal py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? "Updating…" : action.label}
        </button>
      ) : (
        <div className="mt-3 w-full rounded-xl bg-black/5 py-2.5 text-center text-sm font-semibold text-brand-ink/40">
          ✅ Completed
        </div>
      )}
    </div>
  );
}
