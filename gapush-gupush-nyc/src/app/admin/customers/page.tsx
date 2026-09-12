"use client";

import { useApp } from "@/lib/store";
import { useToast } from "@/components/toast/ToastProvider";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default function CustomersPage() {
  const { state } = useApp();
  const { push } = useToast();

  const sorted = [...state.customers].sort((a, b) => b.totalSpent - a.totalSpent);

  function sendPromotion(name: string) {
    push({
      kind: "info",
      title: `Promotion sent to ${name}`,
      body: "Demo only — no real SMS was sent.",
    });
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-brand-ink">Customer CRM</h1>
      <p className="text-sm text-brand-ink/50">
        {state.customers.length} known customers · sorted by lifetime spend
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display font-bold text-brand-ink">{c.name}</p>
                <p className="text-xs text-brand-ink/40">{c.phone}</p>
              </div>
              <span className="rounded-full bg-brand-orange-light px-2 py-1 text-[11px] font-bold text-brand-orange-dark">
                {c.totalOrders} orders
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-black/[0.03] p-2">
                <p className="text-[10px] font-semibold text-brand-ink/40 uppercase">
                  Total Spent
                </p>
                <p className="font-bold text-brand-ink">{formatCurrency(c.totalSpent)}</p>
              </div>
              <div className="rounded-xl bg-black/[0.03] p-2">
                <p className="text-[10px] font-semibold text-brand-ink/40 uppercase">
                  Last Order
                </p>
                <p className="text-xs font-semibold text-brand-ink">
                  {formatDateTime(c.lastOrderAt)}
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs text-brand-ink/50">
              Favorite: <span className="font-bold text-brand-teal">{c.favoriteItem}</span>
            </p>

            <button
              onClick={() => sendPromotion(c.name)}
              className="mt-3 w-full rounded-xl bg-brand-teal py-2 text-xs font-bold text-white active:scale-[0.98]"
            >
              📣 Send Promotion
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
