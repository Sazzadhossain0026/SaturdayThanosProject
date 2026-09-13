"use client";

import { createContext, useContext, useState } from "react";

interface UIContextValue {
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  demoPanelOpen: boolean;
  toggleDemoPanel: () => void;
  closeDemoPanel: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [demoPanelOpen, setDemoPanelOpen] = useState(false);

  return (
    <UIContext.Provider
      value={{
        cartOpen,
        openCart: () => setCartOpen(true),
        closeCart: () => setCartOpen(false),
        demoPanelOpen,
        toggleDemoPanel: () => setDemoPanelOpen((v) => !v),
        closeDemoPanel: () => setDemoPanelOpen(false),
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}
