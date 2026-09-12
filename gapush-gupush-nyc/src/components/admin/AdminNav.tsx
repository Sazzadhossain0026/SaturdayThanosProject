"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Overview", shortLabel: "Overview", icon: "📊" },
  { href: "/admin/orders", label: "Order Queue", shortLabel: "Orders", icon: "🧾" },
  { href: "/admin/insights", label: "Insights", shortLabel: "Insights", icon: "📈" },
  { href: "/admin/customers", label: "Customers", shortLabel: "Customers", icon: "👥" },
  { href: "/admin/catering", label: "Catering", shortLabel: "Catering", icon: "🎉" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop side nav */}
      <nav className="hidden w-56 shrink-0 flex-col gap-1 md:flex">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                active
                  ? "bg-brand-teal text-white"
                  : "text-brand-ink/70 hover:bg-brand-teal/10"
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
        <Link
          href="/"
          className="mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-brand-ink/50 hover:bg-black/5"
        >
          <span>←</span> Back to Customer App
        </Link>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="no-scrollbar fixed inset-x-0 bottom-0 z-30 flex overflow-x-auto border-t border-black/10 bg-white px-1 py-1 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:hidden">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold whitespace-nowrap ${
                active ? "text-brand-orange" : "text-brand-ink/40"
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              {link.shortLabel}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
