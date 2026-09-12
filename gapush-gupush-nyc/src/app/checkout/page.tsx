"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/toast/ToastProvider";
import { formatCurrency } from "@/lib/format";
import { FulfillmentType, PaymentMethod } from "@/lib/types";

export default function CheckoutPage() {
  const { state, cartSubtotal, cartTax, cartTotal, placeOrder } = useApp();
  const { push } = useToast();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("asap");
  const [scheduledTime, setScheduledTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pickup");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const valid =
    name.trim().length > 1 &&
    phone.trim().length >= 7 &&
    (fulfillment === "asap" || scheduledTime) &&
    (paymentMethod === "pickup" ||
      (cardNumber.trim().length >= 12 && cardExpiry && cardCvc.trim().length >= 3));

  if (state.cart.length === 0) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
        <span className="text-5xl">🛍️</span>
        <h1 className="font-display mt-4 text-2xl font-extrabold text-brand-ink">
          Your cart is empty
        </h1>
        <p className="mt-2 text-sm text-brand-ink/50">
          Add something delicious before checking out.
        </p>
        <Link
          href="/menu"
          className="mt-6 rounded-2xl bg-brand-orange px-6 py-3 font-bold text-white active:scale-95"
        >
          Browse Menu
        </Link>
      </main>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    const order = placeOrder({
      customerName: name.trim(),
      phone: phone.trim(),
      fulfillment,
      scheduledTime: fulfillment === "scheduled" ? scheduledTime : undefined,
      paymentMethod,
    });
    push({
      kind: "sms",
      title: "Gapush Gupush",
      body: `We received order ${order.id}. We'll text you when it's ready.`,
    });
    router.push(`/order/${order.id}`);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 pt-6 pb-28">
      <h1 className="font-display text-3xl font-extrabold text-brand-ink">Checkout</h1>
      <p className="text-sm text-brand-ink/50">Almost there — just a few details.</p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]"
      >
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
                <p className="text-xs font-bold text-brand-orange-dark">
                  ⚠️ Demo Payment – No real charge will be made.
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
            disabled={!valid || submitting}
            className="w-full rounded-2xl bg-brand-orange py-4 font-bold text-white shadow-md disabled:opacity-40 active:scale-[0.98]"
          >
            {submitting ? "Placing Order..." : `Place Order · ${formatCurrency(cartTotal)}`}
          </button>
        </aside>
      </form>
    </main>
  );
}
