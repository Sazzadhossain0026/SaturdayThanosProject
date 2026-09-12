"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  buildCartLine,
  DEFAULT_EXTRAS,
  recalcLine,
} from "./cart";
import { getMenuItem, TAX_RATE } from "./menu-data";
import {
  SEED_CATERING_LEADS,
  SEED_CUSTOMERS,
  SEED_NEXT_ORDER_NUMBER,
  SEED_ORDERS,
} from "./seed-data";
import { clearStorage, loadFromStorage, saveToStorage } from "./storage";
import {
  CartExtras,
  CartLine,
  CateringLead,
  Customer,
  FulfillmentType,
  Order,
  OrderStatus,
  PaymentMethod,
  SpiceLevel,
} from "./types";

const STORAGE_KEY = "gapush-gupush-state-v2";

interface AppState {
  cart: CartLine[];
  orders: Order[];
  customers: Customer[];
  cateringLeads: CateringLead[];
  nextOrderNumber: number;
  lastOrderId: string | null;
}

function seedState(): AppState {
  return {
    cart: [],
    orders: SEED_ORDERS,
    customers: SEED_CUSTOMERS,
    cateringLeads: SEED_CATERING_LEADS,
    nextOrderNumber: SEED_NEXT_ORDER_NUMBER,
    lastOrderId: null,
  };
}

interface PlaceOrderInput {
  customerName: string;
  phone: string;
  fulfillment: FulfillmentType;
  scheduledTime?: string;
  paymentMethod: PaymentMethod;
}

interface AppContextValue {
  state: AppState;
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
  placeOrder: (input: PlaceOrderInput) => Order;
  createDemoOrder: () => Order;
  setOrderStatus: (orderId: string, status: OrderStatus) => void;
  markReviewRequested: (orderId: string) => void;
  resetDemo: () => void;
  addCateringLead: (
    lead: Omit<CateringLead, "id" | "createdAt">,
  ) => CateringLead;
  getOrder: (id: string) => Order | undefined;
}

const AppContext = createContext<AppContextValue | null>(null);

function upsertCustomer(
  customers: Customer[],
  order: Order,
): Customer[] {
  const idx = customers.findIndex((c) => c.phone === order.phone);
  const topItemName = order.items[0]?.name ?? "—";
  if (idx === -1) {
    return [
      ...customers,
      {
        id: `cust-${order.phone.replace(/\D/g, "")}`,
        name: order.customerName,
        phone: order.phone,
        totalOrders: 1,
        totalSpent: order.total,
        lastOrderAt: order.createdAt,
        favoriteItem: topItemName,
      },
    ];
  }
  const next = [...customers];
  const existing = next[idx];
  next[idx] = {
    ...existing,
    totalOrders: existing.totalOrders + 1,
    totalSpent: Math.round((existing.totalSpent + order.total) * 100) / 100,
    lastOrderAt: order.createdAt,
    favoriteItem: existing.favoriteItem || topItemName,
  };
  return next;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => seedState());
  const [hydrated, setHydrated] = useState(false);

  // Load persisted state on mount (client only) — runs after initial hydration
  // pass so server/client markup matches, then swaps in saved progress.
  useEffect(() => {
    // Intentional one-time client read: seed state renders identically on the
    // server and first client paint, then this swaps in any saved progress.
    const saved = loadFromStorage<AppState>(STORAGE_KEY);
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
    (
      menuItemId: string,
      spiceLevel: SpiceLevel,
      extras: CartExtras,
      quantity: number,
      instructions: string,
    ) => {
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
      cart: prev.cart
        .map((l) => (l.lineId === lineId ? recalcLine(l, quantity) : l))
        .filter((l) => l.quantity > 0),
    }));
  }, []);

  const removeCartLine = useCallback((lineId: string) => {
    setState((prev) => ({
      ...prev,
      cart: prev.cart.filter((l) => l.lineId !== lineId),
    }));
  }, []);

  const clearCart = useCallback(() => {
    setState((prev) => ({ ...prev, cart: [] }));
  }, []);

  const cartSubtotal = useMemo(
    () =>
      Math.round(state.cart.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100,
    [state.cart],
  );
  const cartTax = useMemo(
    () => Math.round(cartSubtotal * TAX_RATE * 100) / 100,
    [cartSubtotal],
  );
  const cartTotal = useMemo(
    () => Math.round((cartSubtotal + cartTax) * 100) / 100,
    [cartSubtotal, cartTax],
  );
  const cartCount = useMemo(
    () => state.cart.reduce((s, l) => s + l.quantity, 0),
    [state.cart],
  );

  const placeOrder = useCallback(
    (input: PlaceOrderInput): Order => {
      let created: Order | null = null;
      setState((prev) => {
        const subtotal =
          Math.round(prev.cart.reduce((s, l) => s + l.lineTotal, 0) * 100) /
          100;
        const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
        const total = Math.round((subtotal + tax) * 100) / 100;
        const now = Date.now();
        const order: Order = {
          id: `GG-${prev.nextOrderNumber}`,
          customerName: input.customerName,
          phone: input.phone,
          items: prev.cart,
          subtotal,
          tax,
          total,
          fulfillment: input.fulfillment,
          scheduledTime: input.scheduledTime,
          paymentMethod: input.paymentMethod,
          status: "received",
          createdAt: now,
          estimatedReadyAt: now + 20 * 60 * 1000,
        };
        created = order;
        return {
          ...prev,
          cart: [],
          orders: [order, ...prev.orders],
          customers: upsertCustomer(prev.customers, order),
          nextOrderNumber: prev.nextOrderNumber + 1,
          lastOrderId: order.id,
        };
      });
      // `created` is guaranteed set synchronously by the updater above.
      return created as unknown as Order;
    },
    [],
  );

  const createDemoOrder = useCallback((): Order => {
    let created: Order | null = null;
    setState((prev) => {
      const beefChap = getMenuItem("beef-chap")!;
      const fuchka = getMenuItem("fuchka")!;
      const lines = [
        buildCartLine(beefChap, "Hot", DEFAULT_EXTRAS, 1, ""),
        buildCartLine(fuchka, "Hot", DEFAULT_EXTRAS, 1, ""),
      ];
      const now = Date.now();
      const order: Order = {
        id: `GG-${prev.nextOrderNumber}`,
        customerName: "Rahim",
        phone: "(347) 555-0114",
        items: lines,
        subtotal: 18,
        tax: 0,
        total: 18,
        fulfillment: "asap",
        paymentMethod: "pickup",
        status: "received",
        createdAt: now,
        estimatedReadyAt: now + 20 * 60 * 1000,
        isDemo: true,
      };
      created = order;
      return {
        ...prev,
        orders: [order, ...prev.orders],
        customers: upsertCustomer(prev.customers, order),
        nextOrderNumber: prev.nextOrderNumber + 1,
        lastOrderId: order.id,
      };
    });
    return created as unknown as Order;
  }, []);

  const setOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
    }));
  }, []);

  const markReviewRequested = useCallback((orderId: string) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === orderId ? { ...o, reviewRequested: true } : o,
      ),
    }));
  }, []);

  const resetDemo = useCallback(() => {
    clearStorage(STORAGE_KEY);
    setState(seedState());
  }, []);

  const addCateringLead = useCallback(
    (lead: Omit<CateringLead, "id" | "createdAt">): CateringLead => {
      const full: CateringLead = {
        ...lead,
        id: `cat-${Date.now()}`,
        createdAt: Date.now(),
      };
      setState((prev) => ({
        ...prev,
        cateringLeads: [full, ...prev.cateringLeads],
      }));
      return full;
    },
    [],
  );

  const getOrder = useCallback(
    (id: string) => state.orders.find((o) => o.id === id),
    [state.orders],
  );

  const value: AppContextValue = {
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
    placeOrder,
    createDemoOrder,
    setOrderStatus,
    markReviewRequested,
    resetDemo,
    addCateringLead,
    getOrder,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
