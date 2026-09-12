export function StatTile({
  label,
  value,
  icon,
  accent = "orange",
}: {
  label: string;
  value: string;
  icon: string;
  accent?: "orange" | "teal";
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${
            accent === "orange"
              ? "bg-brand-orange-light text-brand-orange-dark"
              : "bg-brand-teal-light text-brand-teal"
          }`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-extrabold text-brand-ink">{value}</p>
      <p className="text-xs font-medium text-brand-ink/50">{label}</p>
    </div>
  );
}
