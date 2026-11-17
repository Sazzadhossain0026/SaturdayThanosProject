"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchCustomers } from "@/lib/api-client";
import { useToast } from "@/components/toast/ToastProvider";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { CustomerSummary } from "@/server/orders";

type SortKey = "spend" | "orders" | "recent" | "name";

const SORTERS: Record<SortKey, (a: CustomerSummary, b: CustomerSummary) => number> = {
  spend: (a, b) => b.totalSpentCents - a.totalSpentCents,
  orders: (a, b) => b.totalOrders - a.totalOrders,
  recent: (a, b) => b.lastOrderAt - a.lastOrderAt,
  name: (a, b) => a.name.localeCompare(b.name),
};

/** Escapes a value for a CSV cell: wrap in quotes, double any embedded quotes. */
function csvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function downloadCustomersCsv(customers: CustomerSummary[]) {
  const header = ["Name", "Phone", "Total Orders", "Total Spent (USD)", "Last Order", "Favorite Item"];
  const rows = customers.map((c) =>
    [
      csvCell(c.name),
      csvCell(c.phone),
      csvCell(c.totalOrders),
      csvCell((c.totalSpentCents / 100).toFixed(2)),
      csvCell(new Date(c.lastOrderAt).toISOString()),
      csvCell(c.favoriteItem),
    ].join(","),
  );
  const csv = [header.map(csvCell).join(","), ...rows].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gapush-gupush-customers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [minOrders, setMinOrders] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("spend");
  const { push } = useToast();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { customers } = await fetchCustomers();
        if (!cancelled) setCustomers(customers);
      } catch {
        if (!cancelled) setError("Couldn't reach the server.");
      }
    }
    load();
    const id = window.setInterval(load, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers
      .filter((c) => c.totalOrders >= minOrders)
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q))
      .sort(SORTERS[sortKey]);
  }, [customers, search, minOrders, sortKey]);

  function sendPromotion(name: string) {
    push({ kind: "info", title: `Promotion sent to ${name}`, body: "Demo only — no real SMS was sent." });
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-brand-ink">Customer CRM</h1>
      <p className="text-sm text-brand-ink/50">
        {customers.length} known customers · only orders that were actually paid or confirmed count
      </p>
      {error && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">⚠️ {error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="min-w-[180px] flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-orange"
        />
        <select
          value={minOrders}
          onChange={(e) => setMinOrders(Number(e.target.value))}
          className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-orange"
        >
          <option value={0}>All customers</option>
          <option value={2}>2+ orders</option>
          <option value={5}>5+ orders (regulars)</option>
        </select>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-orange"
        >
          <option value="spend">Sort: Highest spend</option>
          <option value="orders">Sort: Most orders</option>
          <option value="recent">Sort: Most recent</option>
          <option value="name">Sort: Name A–Z</option>
        </select>
        <button
          onClick={() => downloadCustomersCsv(visible)}
          disabled={visible.length === 0}
          className="rounded-xl bg-brand-teal px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
        >
          ⬇️ Export CSV ({visible.length})
        </button>
      </div>

      {customers.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-black/10 p-6 text-center text-sm text-brand-ink/40">
          No customers yet — place an order (or use Demo Mode) to see one here.
        </p>
      ) : visible.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-black/10 p-6 text-center text-sm text-brand-ink/40">
          No customers match this search/filter.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((c) => (
            <div key={c.phone} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display font-bold text-brand-ink">{c.name}</p>
                  <p className="text-xs text-brand-ink/40">{c.phone}</p>
                </div>
                <span className="rounded-full bg-brand-orange-light px-2 py-1 text-[11px] font-bold text-brand-orange-dark">
                  {c.totalOrders} orders
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-black/[0.03] p-2">
                  <p className="text-[10px] font-semibold text-brand-ink/40 uppercase">Total Spent</p>
                  <p className="font-bold text-brand-ink">{formatCurrency(c.totalSpentCents / 100)}</p>
                </div>
                <div className="rounded-xl bg-black/[0.03] p-2">
                  <p className="text-[10px] font-semibold text-brand-ink/40 uppercase">Last Order</p>
                  <p className="text-xs font-semibold text-brand-ink">{formatDateTime(c.lastOrderAt)}</p>
                </div>
              </div>

              <p className="mt-3 text-xs text-brand-ink/50">
                Favorite: <span className="font-bold text-brand-teal">{c.favoriteItem}</span>
              </p>

              <button
                onClick={() => sendPromotion(c.name)}
                className="mt-3 w-full rounded-xl bg-brand-teal py-2 text-xs font-bold text-white active:scale-[0.98]"
              >
                📣 Send Promotion
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
