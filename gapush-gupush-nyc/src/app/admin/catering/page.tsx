"use client";

import { useEffect, useState } from "react";
import { fetchCateringLeads } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import type { CateringLeadDTO } from "@/server/catering";

export default function CateringLeadsPage() {
  const [leads, setLeads] = useState<CateringLeadDTO[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { leads } = await fetchCateringLeads();
        if (!cancelled) setLeads(leads);
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

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-brand-ink">
        Catering Leads
      </h1>
      <p className="text-sm text-brand-ink/50">
        {leads.length} requests submitted via the catering form
      </p>
      {error && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">⚠️ {error}</p>}

      <div className="mt-5 space-y-3">
        {leads.length === 0 && (
          <p className="rounded-2xl border border-dashed border-black/10 p-6 text-center text-sm text-brand-ink/40">
            No catering requests yet.
          </p>
        )}
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-display font-bold text-brand-ink">{lead.name}</p>
                <p className="text-xs text-brand-ink/40">
                  {lead.phone} · {lead.email}
                </p>
              </div>
              <span className="rounded-full bg-brand-teal-light px-2.5 py-1 text-[11px] font-bold text-brand-teal">
                {formatDateTime(lead.createdAt)}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <InfoBlock label="Event Date" value={lead.eventDate || "—"} />
              <InfoBlock label="Guests" value={lead.guests || "—"} />
              <InfoBlock label="Budget" value={lead.budget || "—"} />
              <InfoBlock label="Location" value={lead.location || "—"} />
            </div>

            {lead.preferences && (
              <p className="mt-3 text-sm text-brand-ink/70">
                <span className="font-semibold text-brand-ink">Preferences: </span>
                {lead.preferences}
              </p>
            )}
            {lead.message && (
              <p className="mt-1 text-sm text-brand-ink/50 italic">“{lead.message}”</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/[0.03] p-2">
      <p className="text-[10px] font-semibold text-brand-ink/40 uppercase">{label}</p>
      <p className="truncate text-xs font-bold text-brand-ink">{value}</p>
    </div>
  );
}
