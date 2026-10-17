"use client";

import { JobRecord, JobStatus, ServiceKey } from "@/lib/types";
import { SERVICES } from "@/lib/services";

type FilterStatus = "all" | JobStatus;
type FilterService = "all" | ServiceKey;

const PIPELINE_STAGES: { label: string; status: JobStatus }[] = [
  { label: "New enquiry", status: "enquiry" },
  { label: "Quotation sent", status: "quotation_sent" },
  { label: "Approved", status: "approved" },
  { label: "Invoice issued", status: "invoiced" },
  { label: "Part-paid", status: "partially_paid" },
  { label: "Paid", status: "paid" },
  { label: "Work Done", status: "closed" },
  { label: "Rejected", status: "request_closed" },
];

export default function ManagementDashboard({
  records,
  activeStatus,
  activeService,
  onStatusSelect,
  onServiceSelect,
  onClearFilters,
}: {
  records: JobRecord[];
  activeStatus: FilterStatus;
  activeService: FilterService;
  onStatusSelect: (status: FilterStatus) => void;
  onServiceSelect: (service: FilterService) => void;
  onClearFilters: () => void;
}) {
  const activeFilterLabel = activeStatus === "all" && activeService === "all"
    ? "All jobs"
    : `${activeService === "all" ? "All services" : SERVICES[activeService].label} · ${activeStatus === "all" ? "All statuses" : activeStatus.replaceAll("_", " ")}`;

  return (
    <section className="panel p-4" aria-label="Job pipeline">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-deep">Job pipeline</h2>
          <p className="text-xs text-muted">Choose a stage to filter the latest jobs.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="dashboard-service-filter">Filter by service</label>
          <select
            id="dashboard-service-filter"
            className="field-input !w-auto text-xs"
            value={activeService}
            onChange={(event) => onServiceSelect(event.target.value as FilterService)}
          >
            <option value="all">All services</option>
            <option value="painting">Painting</option>
            <option value="waterproofing">Waterproofing</option>
          </select>
          {(activeStatus !== "all" || activeService !== "all") && (
            <button type="button" className="btn-outline text-xs" onClick={onClearFilters}>Clear filters</button>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PIPELINE_STAGES.map((stage) => {
          const count = records.filter((record) => record.status === stage.status).length;
          const active = activeStatus === stage.status;
          return (
            <button
              key={stage.status}
              type="button"
              aria-pressed={active}
              onClick={() => onStatusSelect(active ? "all" : stage.status)}
              className={`flex min-h-16 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition ${active ? "border-water bg-water/10 text-water" : "border-line bg-white text-deep hover:bg-panel"}`}
            >
              <span className="text-xs font-semibold">{stage.label}</span>
              <span className="font-display text-lg font-bold">{count}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted">Showing {records.length} {activeFilterLabel.toLowerCase()}.</p>
    </section>
  );
}
