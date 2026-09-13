"use client";

import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store";
import { useUI } from "@/lib/ui-context";
import { formatCurrency } from "@/lib/format";

const HIDDEN_PREFIXES = ["/checkout", "/order", "/admin"];

export function StickyCartBar() {
  const pathname = usePathname();
  const { cartCount, cartTotal } = useApp();
  const { openCart, cartOpen } = useUI();

  const hidden = HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p));
  if (hidden || cartOpen || cartCount === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <button
        onClick={openCart}
        className="animate-pop-in flex w-full max-w-md items-center justify-between rounded-2xl bg-brand-teal px-5 py-4 text-white shadow-xl active:scale-[0.98]"
      >
        <span className="flex items-center gap-2 font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-orange text-sm">
            {cartCount}
          </span>
          View Cart
        </span>
        <span className="font-display text-lg font-extrabold">
          {formatCurrency(cartTotal)}
        </span>
      </button>
    </div>
  );
}
