export default function StatCard({
  label,
  value,
  sub,
  tone = "default",
  active = false,
  onClick,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "good" | "warn" | "bad";
  active?: boolean;
  onClick?: () => void;
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
    <button
      type="button"
      onClick={onClick}
      className={`panel min-w-0 p-3 sm:p-4 flex flex-col gap-1 text-left transition-all duration-150 ${
        active ? "ring-2 ring-water border-water bg-[#F3FBFB]" : "hover:border-water/60 hover:bg-panel/80"
      }`}
      aria-pressed={active}
    >
      <span className="break-words text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</span>
      <span className={`break-words text-xl sm:text-2xl font-bold font-display ${toneClass}`}>{value}</span>
      {sub && <span className="break-words text-xs text-muted">{sub}</span>}
    </button>
  );
}
