"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { StickyCartBar } from "@/components/cart/StickyCartBar";
import { DemoModeWidget } from "@/components/demo/DemoModeWidget";

export function ClientChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Admin dashboard and the standalone kitchen view are both "operator"
  // screens — no customer nav, cart, or footer chrome around them.
  const isOperatorView = pathname?.startsWith("/admin") || pathname?.startsWith("/kitchen");

  return (
    <>
      {!isOperatorView && <Header />}
      <div className={isOperatorView ? "" : "min-h-[calc(100vh-4rem)]"}>{children}</div>
      {!isOperatorView && <Footer />}
      {!isOperatorView && <StickyCartBar />}
      {!isOperatorView && <CartDrawer />}
      <DemoModeWidget />
    </>
  );
}
