"use client";

import Link from "next/link";
import { useMemo } from "react";
import { StatTile } from "@/components/admin/StatTile";
import { formatCurrency } from "@/lib/format";
import { TimeAgo } from "@/components/common/TimeAgo";
import { usePolledOrders } from "@/lib/use-kitchen-orders";

export default function AdminDashboardPage() {
  const { orders, loading, error } = usePolledOrders(4000);

  const stats = useMemo(() => {
    // A card that never left pending_payment (abandoned or declined) isn't
    // a real order for these purposes — same rule the CRM uses.
    const realized = orders.filter((o) => o.status !== "pending_payment" && o.status !== "payment_failed");
    const totalOrders = realized.length;
    const salesCents = realized.reduce((s, o) => s + o.totalCents, 0);
    const waiting = realized.filter((o) => o.status !== "completed").length;
    const completed = realized.filter((o) => o.status === "completed").length;
    const avgCents = totalOrders > 0 ? salesCents / totalOrders : 0;
    return { totalOrders, salesCents, waiting, completed, avgCents };
  }, [orders]);

  const recent = orders.slice(0, 6);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-brand-ink">Dashboard</h1>
      <p className="text-sm text-brand-ink/50">Live snapshot of today at Gapush Gupush NYC.</p>
      {error && (
        <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
          ⚠️ {error} — showing the last data we had.
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Today's Orders" value={`${stats.totalOrders}`} icon="🧾" />
        <StatTile label="Today's Sales" value={formatCurrency(stats.salesCents / 100)} icon="💰" accent="teal" />
        <StatTile label="Average Order" value={formatCurrency(stats.avgCents / 100)} icon="📈" />
        <StatTile label="Waiting Orders" value={`${stats.waiting}`} icon="⏳" accent="teal" />
        <StatTile label="Completed Orders" value={`${stats.completed}`} icon="✅" />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-brand-ink">Recent Orders</h2>
        <Link href="/admin/orders" className="text-sm font-bold text-brand-orange">
          View full queue →
        </Link>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/[0.03] text-xs text-brand-ink/50">
            <tr>
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="hidden px-4 py-3 font-semibold sm:table-cell">Placed</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {!loading && recent.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-brand-ink/40">
                  No orders yet — try Demo Mode.
                </td>
              </tr>
            )}
            {recent.map((o) => (
              <tr key={o.id} className="border-t border-black/5">
                <td className="px-4 py-3 font-bold text-brand-ink">{o.orderNumber}</td>
                <td className="px-4 py-3 text-brand-ink/70">{o.customerName}</td>
                <td className="hidden px-4 py-3 text-brand-ink/50 sm:table-cell">
                  <TimeAgo ts={o.createdAt} />
                </td>
                <td className="px-4 py-3 font-semibold text-brand-ink">{formatCurrency(o.totalCents / 100)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-black/5 px-2 py-1 text-xs font-bold text-brand-ink/60 capitalize">
                    {o.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
