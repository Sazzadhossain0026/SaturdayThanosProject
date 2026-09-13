import type { OrderStatus } from "@/server/types";

const STEPS: { key: OrderStatus; label: string; icon: string }[] = [
  { key: "confirmed", label: "Order Received", icon: "🧾" },
  { key: "preparing", label: "Preparing", icon: "👨‍🍳" },
  { key: "ready", label: "Ready for Pickup", icon: "🥡" },
];

const ORDER: OrderStatus[] = ["pending_payment", "confirmed", "preparing", "ready", "completed"];

export function OrderStatusTracker({ status }: { status: OrderStatus }) {
  // payment_failed/cancelled aren't points on this forward progression —
  // treat them as "nothing achieved yet" so every step renders as pending.
  const currentIdx = status === "payment_failed" || status === "cancelled" ? -1 : ORDER.indexOf(status);

  return (
    <div>
      <div className="flex items-start">
        {STEPS.map((step, i) => {
          const stepIdx = ORDER.indexOf(step.key);
          const done = currentIdx >= stepIdx;
          const active = currentIdx === stepIdx;
          return (
            <div key={step.key} className="flex flex-1 flex-col items-center text-center">
              <div className="flex w-full items-center">
                <div
                  className={`h-0.5 flex-1 ${i === 0 ? "opacity-0" : done ? "bg-brand-orange" : "bg-black/10"}`}
                />
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg transition-colors ${
                    done
                      ? "bg-brand-orange text-white"
                      : "bg-black/5 text-brand-ink/30"
                  } ${active ? "animate-pulse-dot ring-4 ring-brand-orange/20" : ""}`}
                >
                  {step.icon}
                </div>
                <div
                  className={`h-0.5 flex-1 ${i === STEPS.length - 1 ? "opacity-0" : currentIdx > stepIdx ? "bg-brand-orange" : "bg-black/10"}`}
                />
              </div>
              <p
                className={`mt-2 max-w-20 text-xs font-semibold ${done ? "text-brand-ink" : "text-brand-ink/40"}`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
      {status === "completed" && (
        <p className="mt-4 rounded-xl bg-brand-teal-light px-4 py-2 text-center text-sm font-semibold text-brand-teal">
          ✅ Order picked up — thanks for eating with Gapush Gupush!
        </p>
      )}
    </div>
  );
}
