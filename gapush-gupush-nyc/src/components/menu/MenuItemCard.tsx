"use client";

import { MenuItem } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

export function MenuItemCard({
  item,
  onSelect,
  stockLeft,
}: {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
  /** Only passed for the handful of intentionally-limited items — see /api/inventory. undefined = unlimited. */
  stockLeft?: number;
}) {
  const soldOut = stockLeft === 0;
  return (
    <div
      className={`flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md ${soldOut ? "opacity-60" : ""}`}
    >
      <div
        className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-3xl ${item.gradient}`}
      >
        {item.emoji}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-bold text-brand-ink">
            {item.name}
          </h3>
          <span className="shrink-0 font-display text-base font-bold text-brand-orange">
            {formatCurrency(item.price)}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-brand-ink/60">
          {item.description}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex gap-1">
            {item.spicy && <span className="text-xs">🌶️</span>}
            {item.popular && (
              <span className="rounded-full bg-brand-teal-light px-2 py-0.5 text-[10px] font-bold text-brand-teal">
                Popular
              </span>
            )}
            {typeof stockLeft === "number" && stockLeft > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                {stockLeft} left today
              </span>
            )}
            {soldOut && (
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-bold text-brand-ink/50">
                Sold Out
              </span>
            )}
          </div>
          <button
            onClick={() => onSelect(item)}
            disabled={soldOut}
            className="rounded-full bg-brand-teal px-4 py-1.5 text-xs font-bold text-white active:scale-95 disabled:cursor-not-allowed disabled:bg-black/20"
          >
            {soldOut ? "Sold Out" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
