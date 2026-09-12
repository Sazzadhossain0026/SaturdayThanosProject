import Link from "next/link";

const STEPS = [
  { icon: "📱", title: "Scan QR", desc: "Customer scans the table/window QR code." },
  { icon: "🧾", title: "Place Order", desc: "Browses menu, customizes spice & extras, checks out." },
  { icon: "🔔", title: "Owner Receives Order", desc: "New order lands instantly in the live queue." },
  { icon: "✅", title: "Customer Confirmation", desc: "Order number + status tracker shown immediately." },
  { icon: "👨‍🍳", title: "Kitchen Prepares", desc: "Staff taps Accept, then Preparing as they cook." },
  { icon: "🥡", title: "Ready", desc: "Staff marks the order Ready for pickup." },
  { icon: "💬", title: "Customer SMS", desc: "Simulated text lets the customer know it's ready." },
  { icon: "🚶", title: "Pickup", desc: "Customer grabs their order at the counter." },
  { icon: "⭐", title: "Review Request", desc: "A friendly nudge to leave a Google review." },
];

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pt-10 pb-20">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold text-brand-ink sm:text-4xl">
          How Gapush Gupush Works
        </h1>
        <p className="mt-2 text-sm text-brand-ink/50">
          From QR scan to five-star review — the full order lifecycle.
        </p>
      </div>

      <ol className="relative mt-12 space-y-8 border-l-2 border-dashed border-brand-orange/30 pl-8 sm:pl-10">
        {STEPS.map((step, i) => (
          <li key={step.title} className="relative">
            <span className="absolute top-0 -left-[2.65rem] flex h-11 w-11 items-center justify-center rounded-full bg-brand-orange text-lg text-white shadow-md sm:-left-[3.15rem] sm:h-12 sm:w-12">
              {step.icon}
            </span>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-bold tracking-wide text-brand-orange">
                STEP {i + 1}
              </p>
              <h2 className="font-display mt-0.5 text-lg font-bold text-brand-ink">
                {step.title}
              </h2>
              <p className="mt-1 text-sm text-brand-ink/60">{step.desc}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-12 flex flex-col items-center gap-3 rounded-3xl bg-brand-teal p-8 text-center text-white sm:flex-row sm:justify-between sm:text-left">
        <div>
          <h3 className="font-display text-xl font-extrabold">See it in action</h3>
          <p className="mt-1 text-sm text-white/70">
            Try the full flow yourself, or use Demo Mode to fast-forward through it.
          </p>
        </div>
        <Link
          href="/menu"
          className="shrink-0 rounded-2xl bg-brand-orange px-6 py-3 font-bold text-white active:scale-95"
        >
          Start Order →
        </Link>
      </div>
    </main>
  );
}
