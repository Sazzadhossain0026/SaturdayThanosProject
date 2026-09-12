"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { StatTile } from "@/components/admin/StatTile";
import { formatCurrency } from "@/lib/format";
import { TimeAgo } from "@/components/common/TimeAgo";

export default function AdminDashboardPage() {
  const { state } = useApp();

  const stats = useMemo(() => {
    const orders = state.orders;
    const totalOrders = orders.length;
    const sales = orders.reduce((s, o) => s + o.total, 0);
    const waiting = orders.filter((o) => o.status !== "completed").length;
    const completed = orders.filter((o) => o.status === "completed").length;
    const avg = totalOrders > 0 ? sales / totalOrders : 0;
    return { totalOrders, sales, waiting, completed, avg };
  }, [state.orders]);

  const recent = state.orders.slice(0, 6);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-brand-ink">Dashboard</h1>
      <p className="text-sm text-brand-ink/50">Live snapshot of today at Gapush Gupush NYC.</p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Today's Orders" value={`${stats.totalOrders}`} icon="🧾" />
        <StatTile
          label="Today's Sales"
          value={formatCurrency(stats.sales)}
          icon="💰"
          accent="teal"
        />
        <StatTile
          label="Average Order"
          value={formatCurrency(stats.avg)}
          icon="📈"
        />
        <StatTile
          label="Waiting Orders"
          value={`${stats.waiting}`}
          icon="⏳"
          accent="teal"
        />
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
            {recent.map((o) => (
              <tr key={o.id} className="border-t border-black/5">
                <td className="px-4 py-3 font-bold text-brand-ink">{o.id}</td>
                <td className="px-4 py-3 text-brand-ink/70">{o.customerName}</td>
                <td className="hidden px-4 py-3 text-brand-ink/50 sm:table-cell">
                  <TimeAgo ts={o.createdAt} />
                </td>
                <td className="px-4 py-3 font-semibold text-brand-ink">
                  {formatCurrency(o.total)}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-black/5 px-2 py-1 text-xs font-bold text-brand-ink/60 capitalize">
                    {o.status}
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
