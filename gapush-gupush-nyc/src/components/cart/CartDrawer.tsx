"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { useUI } from "@/lib/ui-context";
import { formatCurrency } from "@/lib/format";
import { extrasLabelList } from "@/lib/cart";

export function CartDrawer() {
  const { cartOpen, closeCart } = useUI();
  const { state, cartSubtotal, cartTax, cartTotal, updateCartQuantity, removeCartLine } =
    useApp();
  const router = useRouter();

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close cart"
        onClick={closeCart}
        className="animate-fade-in absolute inset-0 bg-black/40"
      />
      <div className="animate-sheet-up relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/5 p-4">
          <h2 className="font-display text-lg font-bold text-brand-ink">Your Cart</h2>
          <button
            onClick={closeCart}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 active:scale-95"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {state.cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-brand-ink/50">
              <span className="text-4xl">🛍️</span>
              <p className="text-sm font-medium">Your cart is empty.</p>
              <p className="text-xs">Add some street food to get started!</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {state.cart.map((line) => (
                <li
                  key={line.lineId}
                  className="flex gap-3 rounded-2xl border border-black/5 p-3"
                >
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-2xl ${line.gradient}`}
                  >
                    {line.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-brand-ink">{line.name}</p>
                      <p className="shrink-0 font-bold text-brand-orange">
                        {formatCurrency(line.lineTotal)}
                      </p>
                    </div>
                    <p className="text-xs text-brand-ink/50">
                      {line.spiceLevel} spice
                      {extrasLabelList(line.extras).length > 0 &&
                        ` · ${extrasLabelList(line.extras).join(", ")}`}
                    </p>
                    {line.instructions && (
                      <p className="mt-0.5 text-xs italic text-brand-ink/40">
                        “{line.instructions}”
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-3 rounded-full bg-black/5 px-2 py-1">
                        <button
                          onClick={() =>
                            updateCartQuantity(line.lineId, line.quantity - 1)
                          }
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold shadow-sm active:scale-90"
                        >
                          −
                        </button>
                        <span className="w-4 text-center text-sm font-bold">
                          {line.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateCartQuantity(line.lineId, line.quantity + 1)
                          }
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold shadow-sm active:scale-90"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeCartLine(line.lineId)}
                        className="text-xs font-semibold text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {state.cart.length > 0 && (
          <div className="border-t border-black/5 p-4">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-brand-ink/60">
                <span>Subtotal</span>
                <span>{formatCurrency(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-brand-ink/60">
                <span>Tax</span>
                <span>{formatCurrency(cartTax)}</span>
              </div>
              <div className="flex justify-between pt-1 text-base font-bold text-brand-ink">
                <span>Total</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
            </div>
            <button
              onClick={() => {
                closeCart();
                router.push("/checkout");
              }}
              className="mt-4 w-full rounded-2xl bg-brand-orange py-4 font-bold text-white shadow-md active:scale-[0.98]"
            >
              Continue to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
