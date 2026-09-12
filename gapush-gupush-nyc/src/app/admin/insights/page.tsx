"use client";

import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { StatTile } from "@/components/admin/StatTile";
import { BarChart, HorizontalRankChart } from "@/components/charts/BarChart";
import { formatCurrency } from "@/lib/format";
import {
  BUSINESS_INSIGHTS,
  ORDERS_BY_HOUR,
  TOP_SELLING_ITEMS,
  WEEKLY_SALES,
} from "@/lib/seed-data";

export default function InsightsPage() {
  const { state } = useApp();

  const salesToday = useMemo(
    () => state.orders.reduce((s, o) => s + o.total, 0),
    [state.orders],
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-brand-ink">
        Business Insights
      </h1>
      <p className="text-sm text-brand-ink/50">
        Performance trends across sales, orders & customers.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Sales Today" value={formatCurrency(salesToday)} icon="💰" />
        <StatTile
          label="Sales This Week"
          value={formatCurrency(BUSINESS_INSIGHTS.salesThisWeek)}
          icon="📅"
          accent="teal"
        />
        <StatTile
          label="Total Orders"
          value={`${state.orders.length}`}
          icon="🧾"
        />
        <StatTile
          label="Returning Customers"
          value={`${BUSINESS_INSIGHTS.returningCustomers}`}
          icon="🔁"
          accent="teal"
        />
        <StatTile
          label="New Customers"
          value={`${BUSINESS_INSIGHTS.newCustomers}`}
          icon="🆕"
        />
        <StatTile
          label="Catering Leads"
          value={`${state.cateringLeads.length}`}
          icon="🎉"
          accent="teal"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="font-bold text-brand-ink">Daily Sales — This Week</h2>
          <div className="mt-4">
            <BarChart
              data={WEEKLY_SALES.map((d) => ({ label: d.day, value: d.sales }))}
              valueFormatter={(v) => `$${v}`}
              color="var(--color-brand-orange)"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="font-bold text-brand-ink">Orders by Hour — Today</h2>
          <div className="mt-4">
            <BarChart
              data={ORDERS_BY_HOUR.map((d) => ({ label: d.hour, value: d.orders }))}
              color="var(--color-brand-teal)"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:col-span-2">
          <h2 className="font-bold text-brand-ink">Top Selling Food</h2>
          <div className="mt-4">
            <HorizontalRankChart
              data={TOP_SELLING_ITEMS.map((d) => ({ label: d.name, value: d.unitsSold }))}
              valueFormatter={(v) => `${v} sold`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
