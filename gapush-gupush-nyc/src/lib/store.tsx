"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { buildCartLine, recalcLine } from "./cart";
import { getMenuItem, TAX_RATE } from "./menu-data";
import { loadFromStorage, saveToStorage } from "./storage";
import { CartExtras, CartLine, SpiceLevel } from "./types";

/**
 * This used to be a much bigger store: orders, customers, and catering
 * leads all lived here in localStorage, and "checkout" just pushed an
 * object into an array. That model is gone (see CLAUDE.md → "What changed
 * and why") — orders/customers/catering now live server-side in
 * src/server/*, reached through src/lib/api-client.ts, because a shared
 * kitchen view and a real payment/SMS webhook flow cannot be reconciled
 * against per-browser localStorage. What's left here is exactly the part
 * that's legitimately client-only: the cart the customer is building
 * *before* they've checked out.
 */
const STORAGE_KEY = "gapush-gupush-cart-v3";

interface CartState {
  cart: CartLine[];
}

interface CartContextValue {
  state: CartState;
  hydrated: boolean;
  cartCount: number;
  cartSubtotal: number;
  cartTax: number;
  cartTotal: number;
  addToCart: (
    menuItemId: string,
    spiceLevel: SpiceLevel,
    extras: CartExtras,
    quantity: number,
    instructions: string,
  ) => void;
  updateCartQuantity: (lineId: string, quantity: number) => void;
  removeCartLine: (lineId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>({ cart: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadFromStorage<CartState>(STORAGE_KEY);
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(saved);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveToStorage(STORAGE_KEY, state);
  }, [state, hydrated]);

  const addToCart = useCallback(
    (menuItemId: string, spiceLevel: SpiceLevel, extras: CartExtras, quantity: number, instructions: string) => {
      const item = getMenuItem(menuItemId);
      if (!item) return;
      const line = buildCartLine(item, spiceLevel, extras, quantity, instructions);
      setState((prev) => ({ ...prev, cart: [...prev.cart, line] }));
    },
    [],
  );

  const updateCartQuantity = useCallback((lineId: string, quantity: number) => {
    setState((prev) => ({
      ...prev,
      cart: prev.cart.map((l) => (l.lineId === lineId ? recalcLine(l, quantity) : l)).filter((l) => l.quantity > 0),
    }));
  }, []);

  const removeCartLine = useCallback((lineId: string) => {
    setState((prev) => ({ ...prev, cart: prev.cart.filter((l) => l.lineId !== lineId) }));
  }, []);

  const clearCart = useCallback(() => {
    setState((prev) => ({ ...prev, cart: [] }));
  }, []);

  const cartSubtotal = useMemo(
    () => Math.round(state.cart.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100,
    [state.cart],
  );
  const cartTax = useMemo(() => Math.round(cartSubtotal * TAX_RATE * 100) / 100, [cartSubtotal]);
  const cartTotal = useMemo(() => Math.round((cartSubtotal + cartTax) * 100) / 100, [cartSubtotal, cartTax]);
  const cartCount = useMemo(() => state.cart.reduce((s, l) => s + l.quantity, 0), [state.cart]);

  const value: CartContextValue = {
    state,
    hydrated,
    cartCount,
    cartSubtotal,
    cartTax,
    cartTotal,
    addToCart,
    updateCartQuantity,
    removeCartLine,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useApp(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useApp (cart) must be used within AppProvider");
  return ctx;
}
