"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { useUI } from "@/lib/ui-context";
import { useToast } from "@/components/toast/ToastProvider";

export function DemoModeWidget() {
  const { state, createDemoOrder, setOrderStatus, resetDemo } = useApp();
  const { demoPanelOpen, toggleDemoPanel, closeDemoPanel } = useUI();
  const { push } = useToast();
  const router = useRouter();

  const activeOrder = state.orders.find((o) => o.id === state.lastOrderId);

  function handleCreateDemoOrder() {
    const order = createDemoOrder();
    push({
      kind: "sms",
      title: "Gapush Gupush",
      body: `We received order ${order.id}. We'll text you when it's ready.`,
      actionLabel: "Track Order",
      onAction: () => router.push(`/order/${order.id}`),
    });
  }

  function handleSimulate(status: "preparing" | "ready" | "completed") {
    if (!activeOrder) {
      push({
        kind: "info",
        title: "No active order yet",
        body: "Create a demo order first.",
      });
      return;
    }
    setOrderStatus(activeOrder.id, status);
    if (status === "preparing") {
      push({
        kind: "sms",
        title: `SMS to ${activeOrder.customerName}`,
        body: `Your order ${activeOrder.id} is now being prepared.`,
      });
    } else if (status === "ready") {
      push({
        kind: "sms",
        title: `SMS to ${activeOrder.customerName}`,
        body: `Your order ${activeOrder.id} is READY for pickup!`,
      });
    } else {
      push({
        kind: "success",
        title: `Order ${activeOrder.id} completed`,
        body: "Picked up! Review request incoming...",
      });
    }
  }

  function handleReset() {
    resetDemo();
    push({ kind: "info", title: "Demo reset", body: "All demo data restored to defaults." });
    closeDemoPanel();
    router.push("/");
  }

  return (
    <div className="fixed right-4 bottom-28 z-40 flex flex-col items-end gap-2 md:bottom-6">
      {demoPanelOpen && (
        <div className="animate-pop-in w-72 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/10">
          <div className="flex items-center justify-between">
            <p className="text-sm font-extrabold text-brand-ink">Demo Controls</p>
            <button
              onClick={closeDemoPanel}
              className="text-xs text-brand-ink/40"
              aria-label="Close demo controls"
            >
              ✕
            </button>
          </div>
          {activeOrder && (
            <p className="mt-1 text-xs text-brand-ink/50">
              Active: <span className="font-bold text-brand-orange">{activeOrder.id}</span>{" "}
              ({activeOrder.status})
            </p>
          )}
          <div className="mt-3 flex flex-col gap-2">
            <button
              onClick={handleCreateDemoOrder}
              className="rounded-xl bg-brand-orange px-3 py-2.5 text-left text-sm font-bold text-white active:scale-[0.98]"
            >
              🧾 Create Demo Order
            </button>
            <button
              onClick={() => handleSimulate("preparing")}
              className="rounded-xl bg-blue-50 px-3 py-2.5 text-left text-sm font-bold text-blue-700 active:scale-[0.98]"
            >
              👨‍🍳 Simulate Preparing
            </button>
            <button
              onClick={() => handleSimulate("ready")}
              className="rounded-xl bg-emerald-50 px-3 py-2.5 text-left text-sm font-bold text-emerald-700 active:scale-[0.98]"
            >
              🥡 Simulate Ready
            </button>
            <button
              onClick={() => handleSimulate("completed")}
              className="rounded-xl bg-black/5 px-3 py-2.5 text-left text-sm font-bold text-brand-ink/70 active:scale-[0.98]"
            >
              ✅ Simulate Completed
            </button>
            <button
              onClick={handleReset}
              className="mt-1 rounded-xl border border-red-200 px-3 py-2.5 text-left text-sm font-bold text-red-500 active:scale-[0.98]"
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
        <span className="text-[9px] leading-none font-extrabold tracking-wide">
          DEMO
        </span>
      </button>
    </div>
  );
}
