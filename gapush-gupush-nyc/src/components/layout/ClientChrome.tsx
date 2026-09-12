"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { StickyCartBar } from "@/components/cart/StickyCartBar";
import { DemoModeWidget } from "@/components/demo/DemoModeWidget";

export function ClientChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <>
      {!isAdmin && <Header />}
      <div className={isAdmin ? "" : "min-h-[calc(100vh-4rem)]"}>{children}</div>
      {!isAdmin && <Footer />}
      {!isAdmin && <StickyCartBar />}
      {!isAdmin && <CartDrawer />}
      <DemoModeWidget />
    </>
  );
}
