import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f2ee]">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-black/5 bg-brand-teal px-4 text-white">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-orange text-lg">
            🔥
          </span>
          <span>
            <span className="font-display block text-sm leading-none font-extrabold">
              Gapush Gupush
            </span>
            <span className="text-[10px] tracking-widest text-white/60 uppercase">
              Owner Dashboard
            </span>
          </span>
        </Link>
        <Link
          href="/"
          className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
        >
          Customer App ↗
        </Link>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6 pb-24 md:pb-6">
        <AdminNav />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
