"use client";

import { JobRecord, JobStatus, ServiceKey } from "@/lib/types";
import { SERVICES } from "@/lib/services";
import { computeTotals, fmtMoney, isInvoiceRecord } from "@/lib/money";
import { ManagementPanel, OperationsColumn } from "@/lib/settingsSlice";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
} from "recharts";

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
  { label: "Approved", color: "#0891B2", status: "approved" },
  { label: "Pending payment", color: "#F59E0B", status: "invoiced" },
  { label: "Partially paid", color: "#F97316", status: "partially_paid" },
  { label: "Paid", color: "#059669", status: "paid" },
  { label: "Work complete", color: "#334155", status: "closed" },
  { label: "Request closed", color: "#B91C1C", status: "request_closed" },
];

const chartHeight = 230;

export default function ManagementDashboard({
  records,
  activeStatus,
  activeService,
  onStatusSelect,
  onServiceSelect,
  managementPanels,
  operationsColumns,
  visibleStatuses,
}: {
  records: JobRecord[];
  activeStatus: FilterStatus;
  activeService: FilterService;
  onStatusSelect: (status: FilterStatus) => void;
  onServiceSelect: (service: FilterService) => void;
  managementPanels: ManagementPanel[];
  operationsColumns: OperationsColumn[];
  visibleStatuses: JobStatus[];
}) {
  const statusSlices = STATUS_SLICES.filter((slice) => visibleStatuses.includes(slice.status as JobStatus)).map((slice) => ({
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
  const invoiceRecords = records.filter(isInvoiceRecord);
  const paidAmount = invoiceRecords.reduce((sum, record) => sum + computeTotals(record).paidAmount, 0);
  const balanceAmount = invoiceRecords
    .filter((record) => record.status === "invoiced" || record.status === "partially_paid")
    .reduce((sum, record) => sum + computeTotals(record).balanceDue, 0);
  const trendData = Array.from(
    records.reduce((groups, record) => {
      const date = record.updatedAt.slice(0, 10);
      const current = groups.get(date) || { date, collected: 0, outstanding: 0 };
      const totals = computeTotals(record);
      if (isInvoiceRecord(record)) {
        current.collected += totals.paidAmount;
        current.outstanding += totals.balanceDue;
      }
      groups.set(date, current);
      return groups;
    }, new Map<string, { date: string; collected: number; outstanding: number }>()).values()
  ).sort((a, b) => a.date.localeCompare(b.date));
  const serviceValueData = serviceSlices.map((slice) => ({
    name: slice.label,
    value: records
      .filter((record) => record.service === slice.service)
      .reduce((sum, record) => sum + computeTotals(record).total, 0),
    fill: slice.color,
    service: slice.service,
  }));
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
        {managementPanels.includes("requestStatus") && <div className="panel p-4">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display font-bold text-deep">Request status</h3>
              <p className="text-xs text-muted">Click a status to filter the register</p>
            </div>
            <span className="rounded-full bg-panel px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted">Live</span>
          </div>
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusSlices} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#D8DDD9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                <YAxis dataKey="label" type="category" width={92} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar
                  dataKey="value"
                  name="Requests"
                  radius={[0, 4, 4, 0]}
                  onClick={(data) => {
                    const status = (data as unknown as { status?: JobStatus }).status;
                    if (status) onStatusSelect(status);
                  }}
                >
                  {statusSlices.map((slice) => <Cell key={slice.label} fill={slice.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>}

        {managementPanels.includes("serviceMix") && <div className="panel p-4">
          <div className="mb-4">
            <h3 className="font-display font-bold text-deep">Service mix</h3>
            <p className="text-xs text-muted">Click a division to focus the register</p>
          </div>
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceSlices}
                  dataKey="value"
                  nameKey="label"
                  innerRadius="48%"
                  outerRadius="76%"
                  paddingAngle={3}
                  onClick={(data) => {
                    const service = (data as unknown as { service?: ServiceKey }).service;
                    if (service) onServiceSelect(service);
                  }}
                >
                  {serviceSlices.map((slice) => <Cell key={slice.label} fill={slice.color} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>}

        {managementPanels.includes("cashPosition") && <div className="panel p-4">
          <div className="mb-4">
            <h3 className="font-display font-bold text-deep">Cash position</h3>
            <p className="text-xs text-muted">Collected versus outstanding invoices</p>
          </div>
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D8DDD9" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={(value) => `₹${fmtMoney(value)}`} width={58} />
                <Tooltip formatter={(value) => `₹${fmtMoney(Number(value) || 0)}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="collected" name="Collected" stroke="#059669" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="outstanding" name="Outstanding" stroke="#F59E0B" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {managementPanels.includes("operationsMatrix") && <div className="panel p-4">
          <div className="mb-3">
            <h3 className="font-display font-bold text-deep">Operations matrix</h3>
            <p className="text-xs text-muted">A compact view of every request stage</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-xs">
              <thead>
                <tr className="border-b border-line text-left uppercase tracking-wide text-muted">
                  <th className="px-2 py-2">Stage</th>
                  {operationsColumns.includes("requests") && <th className="px-2 py-2 text-right">Requests</th>}
                  {operationsColumns.includes("share") && <th className="px-2 py-2 text-right">Share</th>}
                  {operationsColumns.includes("value") && <th className="px-2 py-2 text-right">Value</th>}
                </tr>
              </thead>
              <tbody>
                {statusSlices.map((slice) => {
                  const count = slice.value;
                  const value = records.filter((record) => record.status === slice.status).reduce((sum, record) => sum + computeTotals(record).total, 0);
                  return (
                    <tr
                      key={slice.label}
                      className="cursor-pointer border-b border-panel transition hover:bg-panel"
                      onClick={() => slice.status && onStatusSelect(slice.status)}
                    >
                      <td className="px-2 py-2 font-semibold"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: slice.color }} />{slice.label}</td>
                      {operationsColumns.includes("requests") && <td className="px-2 py-2 text-right font-semibold">{count}</td>}
                      {operationsColumns.includes("share") && <td className="px-2 py-2 text-right text-muted">{records.length ? Math.round((count / records.length) * 100) : 0}%</td>}
                      {operationsColumns.includes("value") && <td className="px-2 py-2 text-right font-mono">₹{fmtMoney(value)}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>}

        {managementPanels.includes("serviceValueMap") && <div className="panel p-4">
          <div className="mb-3">
            <h3 className="font-display font-bold text-deep">Service value map</h3>
            <p className="text-xs text-muted">Larger blocks represent higher quoted value</p>
          </div>
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap data={serviceValueData} dataKey="value" nameKey="name" stroke="#fff" aspectRatio={4 / 3} isAnimationActive>
                <Tooltip formatter={(value) => `₹${fmtMoney(Number(value) || 0)}`} />
              </Treemap>
            </ResponsiveContainer>
          </div>
        </div>}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs">
        <span className="font-semibold text-muted">Register view:</span>
        <span className="font-bold text-deep">{activeFilterLabel}</span>
        <span className="text-muted">({records.length} records)</span>
      </div>
    </section>
  );
}
