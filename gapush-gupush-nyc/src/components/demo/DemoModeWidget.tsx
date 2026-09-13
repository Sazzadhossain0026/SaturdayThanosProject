"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { useUI } from "@/lib/ui-context";
import { useToast } from "@/components/toast/ToastProvider";
import { ApiError, runKitchenAction, submitCheckoutWithRetry } from "@/lib/api-client";

const DEMO_RESET_KEY = process.env.NEXT_PUBLIC_DEMO_RESET_KEY ?? "letmein";

const DEMO_ORDER_PAYLOAD = {
  customerName: "Rahim",
  phone: "(347) 555-0114",
  items: [
    {
      menuItemId: "beef-chap",
      quantity: 1,
      spiceLevel: "Hot",
      extras: { extraChili: false, extraOnion: false, extraSauce: false, extraTamarind: false },
    },
    {
      menuItemId: "fuchka",
      quantity: 1,
      spiceLevel: "Hot",
      extras: { extraChili: false, extraOnion: false, extraSauce: false, extraTamarind: false },
    },
  ],
  fulfillment: "asap" as const,
  paymentMethod: "pickup" as const,
  isDemo: true,
};

export function DemoModeWidget() {
  const { clearCart } = useApp();
  const { demoPanelOpen, toggleDemoPanel, closeDemoPanel } = useUI();
  const { push } = useToast();
  const router = useRouter();
  const [active, setActive] = useState<{ id: string; orderNumber: string; status: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCreateDemoOrder() {
    setBusy(true);
    try {
      const { order } = await submitCheckoutWithRetry(DEMO_ORDER_PAYLOAD);
      setActive({ id: order.id, orderNumber: order.orderNumber, status: order.status });
      push({
        kind: "sms",
        title: "Gapush Gupush",
        body: `We received order ${order.orderNumber}. We'll text you when it's ready.`,
        actionLabel: "Track Order",
        onAction: () => router.push(`/order/${order.orderNumber}`),
      });
    } catch (err) {
      push({
        kind: "info",
        title: "Couldn't create demo order",
        body: err instanceof ApiError ? err.message : "Check your connection and try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleSimulate(action: "accept" | "ready" | "complete") {
    if (!active) {
      push({ kind: "info", title: "No active order yet", body: "Create a demo order first." });
      return;
    }
    setBusy(true);
    try {
      const { order } = await runKitchenAction(active.id, action);
      setActive({ id: order.id, orderNumber: order.orderNumber, status: order.status });
      if (action === "accept") {
        push({ kind: "sms", title: `SMS to ${DEMO_ORDER_PAYLOAD.customerName}`, body: `Your order ${order.orderNumber} is now being prepared.` });
      } else if (action === "ready") {
        push({ kind: "sms", title: `SMS to ${DEMO_ORDER_PAYLOAD.customerName}`, body: `Your order ${order.orderNumber} is READY for pickup!` });
      } else {
        push({ kind: "success", title: `Order ${order.orderNumber} completed`, body: "Picked up! Review request incoming..." });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        push({ kind: "info", title: "Can't do that yet", body: err.message });
      } else {
        push({ kind: "info", title: "Couldn't update order", body: "Check your connection and try again." });
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    setBusy(true);
    try {
      await fetch(`/demo-reset?key=${encodeURIComponent(DEMO_RESET_KEY)}`);
      clearCart();
      setActive(null);
      push({ kind: "info", title: "Demo reset", body: "All orders, payments, and inventory restored to defaults." });
      closeDemoPanel();
      router.push("/");
    } catch {
      push({ kind: "info", title: "Reset failed", body: "Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed right-4 bottom-28 z-40 flex flex-col items-end gap-2 md:bottom-6">
      {demoPanelOpen && (
        <div className="animate-pop-in w-72 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/10">
          <div className="flex items-center justify-between">
            <p className="text-sm font-extrabold text-brand-ink">Demo Controls</p>
            <button onClick={closeDemoPanel} className="text-xs text-brand-ink/40" aria-label="Close demo controls">
              ✕
            </button>
          </div>
          {active && (
            <p className="mt-1 text-xs text-brand-ink/50">
              Active: <span className="font-bold text-brand-orange">{active.orderNumber}</span> ({active.status})
            </p>
          )}
          <div className="mt-3 flex flex-col gap-2">
            <button
              onClick={handleCreateDemoOrder}
              disabled={busy}
              className="rounded-xl bg-brand-orange px-3 py-2.5 text-left text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
            >
              🧾 Create Demo Order
            </button>
            <button
              onClick={() => handleSimulate("accept")}
              disabled={busy}
              className="rounded-xl bg-blue-50 px-3 py-2.5 text-left text-sm font-bold text-blue-700 active:scale-[0.98] disabled:opacity-50"
            >
              👨‍🍳 Simulate Preparing
            </button>
            <button
              onClick={() => handleSimulate("ready")}
              disabled={busy}
              className="rounded-xl bg-emerald-50 px-3 py-2.5 text-left text-sm font-bold text-emerald-700 active:scale-[0.98] disabled:opacity-50"
            >
              🥡 Simulate Ready
            </button>
            <button
              onClick={() => handleSimulate("complete")}
              disabled={busy}
              className="rounded-xl bg-black/5 px-3 py-2.5 text-left text-sm font-bold text-brand-ink/70 active:scale-[0.98] disabled:opacity-50"
            >
              ✅ Simulate Completed
            </button>
            <button
              onClick={handleReset}
              disabled={busy}
              className="mt-1 rounded-xl border border-red-200 px-3 py-2.5 text-left text-sm font-bold text-red-500 active:scale-[0.98] disabled:opacity-50"
            >
              ♻️ Reset Demo
            </button>
          </div>
        </div>
      )}

      <button
        onClick={toggleDemoPanel}
        aria-label="Toggle demo mode controls"
        className="flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-full bg-brand-teal-dark text-white shadow-xl active:scale-95"
      >
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-brand-orange" />
        <span className="text-[9px] leading-none font-extrabold tracking-wide">DEMO</span>
      </button>
    </div>
  );
}
