export function BarChart({
  data,
  valueFormatter = (v: number) => `${v}`,
  color = "var(--color-brand-orange)",
}: {
  data: { label: string; value: number }[];
  valueFormatter?: (v: number) => string;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex h-48 items-end gap-2 sm:gap-3">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-[10px] font-bold text-brand-ink/60">
            {valueFormatter(d.value)}
          </span>
          <div className="flex h-32 w-full items-end overflow-hidden rounded-md bg-black/[0.03]">
            <div
              className="w-full rounded-md transition-all"
              style={{
                height: `${Math.max((d.value / max) * 100, 4)}%`,
                background: color,
              }}
            />
          </div>
          <span className="text-[10px] font-medium text-brand-ink/40">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function HorizontalRankChart({
  data,
  valueFormatter = (v: number) => `${v}`,
}: {
  data: { label: string; value: number }[];
  valueFormatter?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-6 shrink-0 text-center text-sm">
            {medals[i] ?? i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex justify-between text-xs font-semibold text-brand-ink/70">
              <span className="truncate">{d.label}</span>
              <span>{valueFormatter(d.value)}</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/[0.05]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-orange to-brand-teal"
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
