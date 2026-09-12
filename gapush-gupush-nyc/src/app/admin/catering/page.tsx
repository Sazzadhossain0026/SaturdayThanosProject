"use client";

import { useApp } from "@/lib/store";
import { formatDateTime } from "@/lib/format";

export default function CateringLeadsPage() {
  const { state } = useApp();

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-brand-ink">
        Catering Leads
      </h1>
      <p className="text-sm text-brand-ink/50">
        {state.cateringLeads.length} requests submitted via the catering form
      </p>

      <div className="mt-5 space-y-3">
        {state.cateringLeads.length === 0 && (
          <p className="rounded-2xl border border-dashed border-black/10 p-6 text-center text-sm text-brand-ink/40">
            No catering requests yet.
          </p>
        )}
        {state.cateringLeads.map((lead) => (
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
