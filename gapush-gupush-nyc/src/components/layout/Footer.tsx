import Link from "next/link";

const INTEGRATIONS = [
  "Twilio SMS",
  "n8n Automation",
  "Stripe / Square",
  "Google Reviews",
  "CRM",
  "Loyalty Program",
  "AI Phone Assistant",
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-black/5 bg-brand-teal text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-orange text-lg">
                🔥
              </span>
              <span className="font-display text-lg font-extrabold">
                Gapush Gupush NYC
              </span>
            </div>
            <p className="mt-3 text-sm text-white/70">
              Authentic Bangladeshi Street Food — order ahead, skip the wait.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold tracking-widest text-brand-orange uppercase">
              Explore
            </p>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li><Link href="/menu" className="hover:text-white">Order the Menu</Link></li>
              <li><Link href="/catering" className="hover:text-white">Catering Requests</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white">How It Works</Link></li>
              <li><Link href="/admin" className="hover:text-white">Owner Dashboard →</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold tracking-widest text-brand-orange uppercase">
              Future Integrations
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {INTEGRATIONS.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          Gapush Gupush NYC · Demo prototype for pitch purposes · No real orders or payments are processed.
        </div>
      </div>
    </footer>
  );
}
