export default function StatCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-600"
      : tone === "warn"
      ? "text-amber-600"
      : tone === "bad"
      ? "text-red-600"
      : "text-deep";

  return (
    <div className="panel p-4 flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</span>
      <span className={`text-2xl font-bold font-display ${toneClass}`}>{value}</span>
      {sub && <span className="text-xs text-muted">{sub}</span>}
    </div>
  );
}
