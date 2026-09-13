"use client";

import { useMemo, useState } from "react";
import { MenuItem, CartExtras, SpiceLevel } from "@/lib/types";
import { DEFAULT_EXTRAS, EXTRA_LABELS, EXTRA_PRICES, SPICE_LEVELS, extrasTotal } from "@/lib/cart";
import { formatCurrency } from "@/lib/format";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/toast/ToastProvider";
import { useUI } from "@/lib/ui-context";

export function ItemCustomizeModal({
  item,
  onClose,
}: {
  item: MenuItem;
  onClose: () => void;
}) {
  const [spiceLevel, setSpiceLevel] = useState<SpiceLevel>(
    item.spicy ? "Medium" : "Mild",
  );
  const [extras, setExtras] = useState<CartExtras>(DEFAULT_EXTRAS);
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState("");
  const { addToCart } = useApp();
  const { push } = useToast();
  const { openCart } = useUI();

  const unitPrice = useMemo(
    () => item.price + extrasTotal(extras),
    [item.price, extras],
  );
  const lineTotal = useMemo(
    () => Math.round(unitPrice * quantity * 100) / 100,
    [unitPrice, quantity],
  );

  function toggleExtra(key: keyof CartExtras) {
    setExtras((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleAdd() {
    addToCart(item.id, spiceLevel, extras, quantity, instructions);
    push({
      kind: "success",
      title: `Added ${item.name} to cart`,
      body: `${quantity} × ${item.name} · ${formatCurrency(lineTotal)}`,
      actionLabel: "View Cart",
      onAction: openCart,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="Close"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 bg-black/40"
      />
      <div className="animate-sheet-up relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white sm:max-w-md sm:rounded-3xl">
        <div className="flex items-center gap-3 border-b border-black/5 p-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-2xl ${item.gradient}`}
          >
            {item.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold text-brand-ink">{item.name}</h2>
            <p className="text-sm font-semibold text-brand-orange">
              {formatCurrency(item.price)}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/5 text-brand-ink active:scale-95"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-brand-ink/60">{item.description}</p>

          <section className="mt-5">
            <h3 className="text-sm font-bold text-brand-ink">Spice Level</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {SPICE_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setSpiceLevel(level)}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                    spiceLevel === level
                      ? "border-brand-orange bg-brand-orange-light text-brand-orange-dark"
                      : "border-black/10 text-brand-ink/70"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-5">
            <h3 className="text-sm font-bold text-brand-ink">Extras</h3>
            <div className="mt-2 space-y-2">
              {(Object.keys(EXTRA_LABELS) as (keyof CartExtras)[]).map((key) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-black/10 px-3 py-2.5"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-brand-ink">
                    <input
                      type="checkbox"
                      checked={extras[key]}
                      onChange={() => toggleExtra(key)}
                      className="h-4 w-4 accent-orange-600"
                    />
                    {EXTRA_LABELS[key]}
                  </span>
                  <span className="text-xs font-semibold text-brand-ink/50">
                    +{formatCurrency(EXTRA_PRICES[key])}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="mt-5">
            <h3 className="text-sm font-bold text-brand-ink">Quantity</h3>
            <div className="mt-2 flex w-fit items-center gap-4 rounded-full bg-black/5 px-2 py-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-bold text-brand-ink shadow-sm active:scale-90"
              >
                −
              </button>
              <span className="w-6 text-center text-base font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-bold text-brand-ink shadow-sm active:scale-90"
              >
                +
              </button>
            </div>
          </section>

          <section className="mt-5">
            <h3 className="text-sm font-bold text-brand-ink">Special Instructions</h3>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. less oil, no onion on the side..."
              rows={2}
              className="mt-2 w-full resize-none rounded-xl border border-black/10 p-3 text-sm outline-none focus:border-brand-orange"
            />
          </section>
        </div>

        <div className="border-t border-black/5 p-4">
          <button
            onClick={handleAdd}
            className="flex w-full items-center justify-between rounded-2xl bg-brand-orange px-5 py-4 font-bold text-white shadow-md active:scale-[0.98]"
          >
            <span>Add to Cart</span>
            <span>{formatCurrency(lineTotal)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
