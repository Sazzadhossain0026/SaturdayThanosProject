import Link from "next/link";
import { MENU_ITEMS } from "@/lib/menu-data";
import { formatCurrency } from "@/lib/format";

const POPULAR_ITEMS = MENU_ITEMS.filter((item) => item.popular).slice(0, 6);

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-orange-light via-brand-cream to-brand-cream px-4 pt-10 pb-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-brand-orange/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-40 -left-20 h-56 w-56 rounded-full bg-brand-teal/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-orange to-brand-orange-dark text-4xl shadow-lg shadow-orange-900/10">
            🔥
          </div>
          <h1 className="font-display mt-5 text-4xl font-extrabold tracking-tight text-brand-teal sm:text-5xl">
            Gapush Gupush NYC
          </h1>
          <p className="mt-2 text-lg font-semibold text-brand-orange-dark">
            Authentic Bangladeshi Street Food
          </p>
          <p className="mt-1 text-sm font-medium tracking-wide text-brand-ink/60 uppercase">
            Order Ahead • Skip the Wait
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <span className="h-2 w-2 animate-pulse-dot rounded-full bg-emerald-500" />
              Open Now
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-brand-ink/70 shadow-sm ring-1 ring-black/5">
              🕒 Pickup in 15–25 min
            </span>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/menu"
              className="rounded-2xl bg-brand-orange px-8 py-4 text-base font-bold text-white shadow-lg shadow-orange-900/15 transition-transform active:scale-[0.98]"
            >
              Start Order →
            </Link>
            <Link
              href="/catering"
              className="rounded-2xl border-2 border-brand-teal bg-white px-8 py-4 text-base font-bold text-brand-teal transition-transform active:scale-[0.98]"
            >
              Catering Request
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Today */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-brand-ink">
              Popular Today
            </h2>
            <p className="text-sm text-brand-ink/50">What NYC is ordering right now</p>
          </div>
          <Link href="/menu" className="text-sm font-bold text-brand-orange">
            See full menu →
          </Link>
        </div>

        <div className="no-scrollbar mt-5 flex gap-4 overflow-x-auto pb-2">
          {POPULAR_ITEMS.map((item) => (
            <Link
              key={item.id}
              href="/menu"
              className="w-40 shrink-0 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md"
            >
              <div
                className={`flex h-24 w-full items-center justify-center rounded-xl bg-gradient-to-br text-4xl ${item.gradient}`}
              >
                {item.emoji}
              </div>
              <p className="mt-2 truncate font-display text-sm font-bold text-brand-ink">
                {item.name}
              </p>
              <p className="text-xs font-bold text-brand-orange">
                {formatCurrency(item.price)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* QR ordering callout */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-brand-teal px-6 py-8 text-white sm:flex-row sm:justify-between sm:px-10">
          <div className="text-center sm:text-left">
            <p className="text-xs font-bold tracking-widest text-brand-orange uppercase">
              At the truck?
            </p>
            <h3 className="font-display mt-1 text-2xl font-extrabold">
              Scan. Order. Skip the Line.
            </h3>
            <p className="mt-2 max-w-sm text-sm text-white/75">
              Every table tent & window sticker has a QR code — scan it to jump
              straight into the menu and order ahead from your phone.
            </p>
          </div>
          <div className="grid h-32 w-32 shrink-0 grid-cols-5 gap-1 rounded-2xl bg-white p-3 shadow-lg">
            {Array.from({ length: 25 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-sm ${
                  [0, 4, 20, 24, 12, 2, 7, 11, 13, 17, 22].includes(i)
                    ? "bg-brand-teal-dark"
                    : (i * 7) % 5 === 0
                      ? "bg-brand-teal-dark"
                      : "bg-transparent"
                }`}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
