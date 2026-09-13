"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { formatCurrency } from "@/lib/format";
import { FulfillmentType, PaymentMethod } from "@/lib/types";
import {
  ApiError,
  clearPendingCheckout,
  confirmPayment,
  loadPendingCheckout,
  submitCheckoutWithRetry,
  type CheckoutProgress,
} from "@/lib/api-client";
import type { CreateOrderInput } from "@/server/types";

type Phase =
  | "form"
  | "submitting"
  | "confirming-card"
  | "order-error"
  | "network-failed"
  | "declined";

export default function CheckoutPage() {
  const { state, cartSubtotal, cartTax, cartTotal, clearCart } = useApp();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("asap");
  const [scheduledTime, setScheduledTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pickup");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const [phase, setPhase] = useState<Phase>("form");
  const [progress, setProgress] = useState<CheckoutProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resumable, setResumable] = useState(false);

  // A checkout that never got a response (dropped connection, closed tab
  // mid-retry) leaves a record in localStorage — offer to pick it back up
  // instead of silently losing it. See lib/api-client.ts.
  useEffect(() => {
    // Intentional client-only check, not a subscription — see TimeAgo.tsx
    // for why this pattern is fine despite the lint rule's default advice.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResumable(Boolean(loadPendingCheckout()));
  }, []);

  // Found via the 3G/offline resilience testing: the checkout form is tall
  // enough that a customer who scrolled down to reach "Place Order" stays
  // scrolled there when the phase swaps to a much shorter status/error
  // panel — leaving them looking at the footer instead of the message that
  // actually matters. Every phase change should start back at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
    // Belt-and-suspenders: guards against anything else (browser scroll
    // restoration on a repeated pushState to the same path, a focused
    // element scrolling itself back into view as it unmounts) re-scrolling
    // within the same tick as the phase change.
    const id = window.setTimeout(() => window.scrollTo(0, 0), 50);
    return () => window.clearTimeout(id);
  }, [phase]);

  const valid =
    name.trim().length > 1 &&
    phone.trim().length >= 7 &&
    (fulfillment === "asap" || scheduledTime) &&
    (paymentMethod === "pickup" || (cardNumber.trim().length >= 12 && cardExpiry && cardCvc.trim().length >= 3));

  if (state.cart.length === 0 && phase === "form") {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
        <span className="text-5xl">🛍️</span>
        <h1 className="font-display mt-4 text-2xl font-extrabold text-brand-ink">Your cart is empty</h1>
        <p className="mt-2 text-sm text-brand-ink/50">Add something delicious before checking out.</p>
        <Link href="/menu" className="mt-6 rounded-2xl bg-brand-orange px-6 py-3 font-bold text-white active:scale-95">
          Browse Menu
        </Link>
      </main>
    );
  }

  async function runCheckout() {
    setPhase("submitting");
    setErrorMessage(null);
    setProgress(null);

    const payload: CreateOrderInput = {
      customerName: name.trim(),
      phone: phone.trim(),
      items: state.cart.map((line) => ({
        menuItemId: line.menuItemId,
        quantity: line.quantity,
        spiceLevel: line.spiceLevel,
        extras: line.extras,
        instructions: line.instructions,
      })),
      fulfillment,
      scheduledTime: fulfillment === "scheduled" ? scheduledTime : undefined,
      paymentMethod,
    };

    try {
      const { order, paymentIntent } = await submitCheckoutWithRetry(
        payload,
        setProgress,
        loadPendingCheckout()?.idempotencyKey,
      );

      if (paymentMethod === "pickup" || !paymentIntent) {
        clearCart();
        router.push(`/order/${order.orderNumber}`);
        return;
      }

      setPhase("confirming-card");
      try {
        await confirmPayment(paymentIntent.id, cardNumber, cardExpiry, cardCvc);
        // Card accepted — the order is still "pending_payment" until the
        // Stripe webhook lands a moment later. The order page itself shows
        // that "confirming" gap and its own timeout/error state, so we can
        // navigate now instead of blocking here.
        clearCart();
        router.push(`/order/${order.orderNumber}`);
      } catch (err) {
        if (err instanceof ApiError && err.status === 402) {
          setErrorMessage(err.message);
          setPhase("declined");
        } else {
          // The order exists server-side, but we don't know if the card
          // confirmation reached the server. Send them to tracking rather
          // than guessing — its own polling/timeout will resolve this.
          router.push(`/order/${order.orderNumber}`);
        }
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === "sold_out") {
        setErrorMessage(`${err.message} Remove it from your cart and try again.`);
        setPhase("order-error");
      } else if (err instanceof ApiError) {
        setErrorMessage(err.message);
        setPhase("order-error");
      } else {
        setErrorMessage(
          "We couldn't reach Gapush Gupush after several tries. Your order has NOT been placed — nothing was charged.",
        );
        setPhase("network-failed");
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || phase !== "form") return;
    runCheckout();
  }

  function backToForm() {
    setPhase("form");
    setErrorMessage(null);
    setProgress(null);
  }

  function discardPending() {
    clearPendingCheckout();
    setResumable(false);
  }

  // ---------------------------------------------------------------------
  // Non-"form" phases each get their own full panel — this is the
  // optimistic / resilience UI: the moment "Place Order" is tapped, the
  // form disappears in favor of visible progress, not a spinner glued to a
  // disabled button.
  // ---------------------------------------------------------------------
  if (phase === "submitting" || phase === "confirming-card") {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <span className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
        <h1 className="font-display text-xl font-extrabold text-brand-ink">
          {phase === "confirming-card" ? "Confirming your card…" : "Placing your order…"}
        </h1>
        {progress?.phase === "retrying" && (
          <p className="mt-2 max-w-xs text-sm text-amber-600">
            Connection trouble — retrying (attempt {progress.attempt})…
          </p>
        )}
        {progress?.phase === "submitting" && progress.attempt > 1 && (
          <p className="mt-2 text-sm text-brand-ink/50">Retry attempt {progress.attempt}…</p>
        )}
        <p className="mt-4 text-xs text-brand-ink/40">Don&apos;t close this tab.</p>
      </main>
    );
  }

  if (phase === "network-failed") {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <span className="text-5xl">📡</span>
        <h1 className="font-display mt-4 text-xl font-extrabold text-brand-ink">Connection trouble</h1>
        <p className="mt-2 text-sm text-brand-ink/60">{errorMessage}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button onClick={runCheckout} className="rounded-2xl bg-brand-orange px-6 py-3 font-bold text-white active:scale-95">
            Try Again
          </button>
          <button onClick={backToForm} className="rounded-2xl border border-black/10 px-6 py-3 font-bold text-brand-ink/70">
            Edit Order
          </button>
        </div>
      </main>
    );
  }

  if (phase === "declined") {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <span className="text-5xl">💳</span>
        <h1 className="font-display mt-4 text-xl font-extrabold text-brand-ink">Card declined</h1>
        <p className="mt-2 text-sm text-brand-ink/60">{errorMessage}</p>
        <p className="mt-1 text-xs text-brand-ink/40">Try 4242 4242 4242 4242 for a successful demo payment.</p>
        <button
          onClick={() => {
            setCardNumber("");
            setCardCvc("");
            backToForm();
          }}
          className="mt-6 rounded-2xl bg-brand-orange px-6 py-3 font-bold text-white active:scale-95"
        >
          Try a Different Card
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 pt-6 pb-28">
      <h1 className="font-display text-3xl font-extrabold text-brand-ink">Checkout</h1>
      <p className="text-sm text-brand-ink/50">Almost there — just a few details.</p>

      {resumable && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <span className="text-amber-700">
            An earlier order attempt didn&apos;t finish — your cart above is safe to resubmit.
          </span>
          <button onClick={discardPending} className="font-bold text-amber-700 underline">
            Discard it
          </button>
        </div>
      )}

      {phase === "order-error" && errorMessage && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          ⚠️ {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <h2 className="text-sm font-bold text-brand-ink">Contact Info</h2>
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-semibold text-brand-ink/50">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="mt-1 w-full rounded-xl border border-black/10 px-3 py-3 text-sm outline-none focus:border-brand-orange"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-ink/50">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 555-5555"
                  type="tel"
                  required
                  className="mt-1 w-full rounded-xl border border-black/10 px-3 py-3 text-sm outline-none focus:border-brand-orange"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <h2 className="text-sm font-bold text-brand-ink">Pickup Time</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFulfillment("asap")}
                className={`rounded-xl border px-3 py-3 text-sm font-bold ${
                  fulfillment === "asap"
                    ? "border-brand-orange bg-brand-orange-light text-brand-orange-dark"
                    : "border-black/10 text-brand-ink/60"
                }`}
              >
                ASAP (15–25 min)
              </button>
              <button
                type="button"
                onClick={() => setFulfillment("scheduled")}
                className={`rounded-xl border px-3 py-3 text-sm font-bold ${
                  fulfillment === "scheduled"
                    ? "border-brand-orange bg-brand-orange-light text-brand-orange-dark"
                    : "border-black/10 text-brand-ink/60"
                }`}
              >
                Schedule Pickup
              </button>
            </div>
            {fulfillment === "scheduled" && (
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
                className="mt-3 w-full rounded-xl border border-black/10 px-3 py-3 text-sm outline-none focus:border-brand-orange"
              />
            )}
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <h2 className="text-sm font-bold text-brand-ink">Payment</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("pickup")}
                className={`rounded-xl border px-3 py-3 text-sm font-bold ${
                  paymentMethod === "pickup"
                    ? "border-brand-teal bg-brand-teal-light text-brand-teal"
                    : "border-black/10 text-brand-ink/60"
                }`}
              >
                Pay at Pickup
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("online")}
                className={`rounded-xl border px-3 py-3 text-sm font-bold ${
                  paymentMethod === "online"
                    ? "border-brand-teal bg-brand-teal-light text-brand-teal"
                    : "border-black/10 text-brand-ink/60"
                }`}
              >
                Pay Online
              </button>
            </div>

            {paymentMethod === "online" && (
              <div className="mt-4 rounded-xl border border-dashed border-brand-orange/40 bg-brand-orange-light p-3">
                <p className="text-xs font-bold text-brand-orange-dark">⚠️ Demo Payment – No real charge will be made.</p>
                <p className="mt-1 text-[11px] text-brand-orange-dark/70">
                  Test cards: 4242 4242 4242 4242 (success) · 4000 0000 0000 0002 (declined)
                </p>
                <div className="mt-3 space-y-2">
                  <input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="Card Number · 4242 4242 4242 4242"
                    inputMode="numeric"
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm outline-none focus:border-brand-orange"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm outline-none focus:border-brand-orange"
                    />
                    <input
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="CVC"
                      inputMode="numeric"
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm outline-none focus:border-brand-orange"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="h-fit space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 lg:sticky lg:top-24">
          <h2 className="text-sm font-bold text-brand-ink">Order Summary</h2>
          <ul className="space-y-2 border-b border-black/5 pb-3 text-sm">
            {state.cart.map((line) => (
              <li key={line.lineId} className="flex justify-between text-brand-ink/70">
                <span className="truncate pr-2">
                  {line.quantity}× {line.name}
                </span>
                <span className="shrink-0 font-medium">{formatCurrency(line.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-brand-ink/60">
              <span>Subtotal</span>
              <span>{formatCurrency(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between text-brand-ink/60">
              <span>Tax</span>
              <span>{formatCurrency(cartTax)}</span>
            </div>
            <div className="flex justify-between pt-1 text-base font-extrabold text-brand-ink">
              <span>Total</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={!valid}
            className="w-full rounded-2xl bg-brand-orange py-4 font-bold text-white shadow-md disabled:opacity-40 active:scale-[0.98]"
          >
            {`Place Order · ${formatCurrency(cartTotal)}`}
          </button>
        </aside>
      </form>
    </main>
  );
}
