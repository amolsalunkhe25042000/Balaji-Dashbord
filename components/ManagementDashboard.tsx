"use client";

import { JobRecord, JobStatus, ServiceKey } from "@/lib/types";
import { SERVICES } from "@/lib/services";
import { computeTotals, fmtMoney } from "@/lib/money";

type FilterStatus = "all" | JobStatus;
type FilterService = "all" | ServiceKey;

type Slice = {
  label: string;
  value: number;
  color: string;
  status?: JobStatus;
  service?: ServiceKey;
};

const STATUS_SLICES: Omit<Slice, "value">[] = [
  { label: "Enquiry", color: "#94A3B8", status: "enquiry" },
  { label: "Quotation sent", color: "#3B82F6", status: "quotation_sent" },
  { label: "Pending payment", color: "#F59E0B", status: "invoiced" },
  { label: "Partially paid", color: "#F97316", status: "partially_paid" },
  { label: "Paid", color: "#059669", status: "paid" },
  { label: "Work complete", color: "#334155", status: "closed" },
  { label: "Request closed", color: "#B91C1C", status: "request_closed" },
];

function totalOf(slices: Slice[]) {
  return slices.reduce((sum, slice) => sum + slice.value, 0);
}

function PieChart({ slices, centerLabel, centerValue }: { slices: Slice[]; centerLabel: string; centerValue: string }) {
  const total = totalOf(slices);
  let cursor = 0;
  const stops = slices.map((slice) => {
    const start = total ? (cursor / total) * 360 : 0;
    cursor += slice.value;
    const end = total ? (cursor / total) * 360 : 360;
    return `${slice.color} ${start}deg ${end}deg`;
  });

  return (
    <div
      className="relative h-44 w-44 shrink-0 rounded-full"
      style={{ background: `conic-gradient(${stops.length ? stops.join(", ") : "#D8DDD9 0deg 360deg"})` }}
      aria-label={`${centerValue} ${centerLabel}`}
    >
      <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-white text-center">
        <strong className="font-display text-2xl text-deep">{centerValue}</strong>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">{centerLabel}</span>
      </div>
    </div>
  );
}

function Legend({ slices, onSelect }: { slices: Slice[]; onSelect?: (slice: Slice) => void }) {
  const total = totalOf(slices);
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      {slices.map((slice) => {
        const percentage = total ? Math.round((slice.value / total) * 100) : 0;
        const content = (
          <>
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
            <span className="min-w-0 flex-1 truncate text-xs text-ink">{slice.label}</span>
            <span className="text-xs font-semibold text-deep">{slice.value}</span>
            <span className="w-9 text-right text-[11px] text-muted">{percentage}%</span>
          </>
        );
        return onSelect ? (
          <button key={slice.label} className="flex items-start gap-2 text-left hover:opacity-70" onClick={() => onSelect(slice)}>
            {content}
          </button>
        ) : (
          <div key={slice.label} className="flex items-start gap-2">
            {content}
          </div>
        );
      })}
    </div>
  );
}

export default function ManagementDashboard({
  records,
  activeStatus,
  activeService,
  onStatusSelect,
  onServiceSelect,
}: {
  records: JobRecord[];
  activeStatus: FilterStatus;
  activeService: FilterService;
  onStatusSelect: (status: FilterStatus) => void;
  onServiceSelect: (service: FilterService) => void;
}) {
  const statusSlices = STATUS_SLICES.map((slice) => ({
    ...slice,
    value: records.filter((record) => record.status === slice.status).length,
  }));
  const serviceSlices: Slice[] = [
    {
      label: SERVICES.painting.label,
      value: records.filter((record) => record.service === "painting").length,
      color: SERVICES.painting.accentHex,
      service: "painting",
    },
    {
      label: SERVICES.waterproofing.label,
      value: records.filter((record) => record.service === "waterproofing").length,
      color: SERVICES.waterproofing.accentHex,
      service: "waterproofing",
    },
  ];
  const paidAmount = records.reduce((sum, record) => sum + computeTotals(record).paidAmount, 0);
  const balanceAmount = records.reduce((sum, record) => sum + computeTotals(record).balanceDue, 0);
  const financialSlices: Slice[] = [
    { label: "Collected", value: paidAmount, color: "#059669" },
    { label: "Outstanding", value: balanceAmount, color: "#F59E0B" },
  ];
  const activeFilterLabel =
    activeStatus === "all" && activeService === "all"
      ? "All requests"
      : `${activeService === "all" ? "All services" : SERVICES[activeService].label} · ${
          activeStatus === "all" ? "All statuses" : STATUS_SLICES.find((slice) => slice.status === activeStatus)?.label
        }`;

  return (
    <section className="flex flex-col gap-3" aria-label="Project management overview">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-water">Project management plan</p>
          <h2 className="font-display text-2xl font-bold text-deep">Work pipeline at a glance</h2>
        </div>
        <button
          className={`btn-outline text-xs ${activeStatus === "all" && activeService === "all" ? "invisible" : ""}`}
          onClick={() => {
            onStatusSelect("all");
            onServiceSelect("all");
          }}
        >
          Clear dashboard filters
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="panel p-4">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display font-bold text-deep">Request status</h3>
              <p className="text-xs text-muted">Click a status to filter the register</p>
            </div>
            <span className="rounded-full bg-panel px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted">Live</span>
          </div>
          <div className="flex items-center gap-4">
            <PieChart slices={statusSlices} centerValue={String(records.length)} centerLabel="requests" />
            <Legend slices={statusSlices} onSelect={(slice) => onStatusSelect(slice.status || "all")} />
          </div>
        </div>

        <div className="panel p-4">
          <div className="mb-4">
            <h3 className="font-display font-bold text-deep">Service mix</h3>
            <p className="text-xs text-muted">Click a division to focus the register</p>
          </div>
          <div className="flex items-center gap-4">
            <PieChart slices={serviceSlices} centerValue={String(records.length)} centerLabel="requests" />
            <Legend slices={serviceSlices} onSelect={(slice) => onServiceSelect(slice.service || "all")} />
          </div>
        </div>

        <div className="panel p-4">
          <div className="mb-4">
            <h3 className="font-display font-bold text-deep">Cash position</h3>
            <p className="text-xs text-muted">Collected versus outstanding value</p>
          </div>
          <div className="flex items-center gap-4">
            <PieChart slices={financialSlices} centerValue={`₹${fmtMoney(paidAmount + balanceAmount)}`} centerLabel="pipeline" />
            <Legend slices={financialSlices} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs">
        <span className="font-semibold text-muted">Register view:</span>
        <span className="font-bold text-deep">{activeFilterLabel}</span>
        <span className="text-muted">({records.length} records)</span>
      </div>
    </section>
  );
}
