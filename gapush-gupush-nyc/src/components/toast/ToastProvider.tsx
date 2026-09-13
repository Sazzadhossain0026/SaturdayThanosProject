"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { ToastMessage } from "@/lib/types";

interface ToastContextValue {
  push: (toast: Omit<ToastMessage, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastMessage["kind"], string> = {
  sms: "💬",
  info: "🔔",
  success: "✅",
  review: "⭐",
};

const RING: Record<ToastMessage["kind"], string> = {
  sms: "ring-brand-teal/20 bg-brand-teal text-white",
  info: "ring-black/5 bg-white text-brand-ink",
  success: "ring-black/5 bg-white text-brand-ink",
  review: "ring-black/5 bg-white text-brand-ink",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const counter = useRef(0);

  const push = useCallback((toast: Omit<ToastMessage, "id">) => {
    counter.current += 1;
    const id = `toast-${Date.now()}-${counter.current}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    const duration = toast.kind === "sms" ? 6000 : 4500;
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const dismiss = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed top-3 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-3 sm:top-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-toast-in pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3 shadow-lg ring-1 ${RING[t.kind]}`}
          >
            <span className="text-lg leading-none">{ICONS[t.kind]}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.body && (
                <p
                  className={`mt-0.5 text-xs leading-snug ${t.kind === "sms" ? "text-white/85" : "text-brand-ink/70"}`}
                >
                  {t.body}
                </p>
              )}
              {t.actionLabel && t.onAction && (
                <button
                  onClick={() => {
                    t.onAction?.();
                    dismiss(t.id);
                  }}
                  className="mt-2 rounded-full bg-brand-orange px-3 py-1 text-xs font-semibold text-white active:scale-95"
                >
                  {t.actionLabel}
                </button>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className={`shrink-0 text-xs opacity-60 ${t.kind === "sms" ? "text-white" : "text-brand-ink"}`}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
