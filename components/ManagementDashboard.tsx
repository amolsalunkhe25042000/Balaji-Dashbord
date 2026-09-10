"use client";

import { JobRecord, JobStatus, ServiceKey, BusinessExpense } from "@/lib/types";
import { SERVICES } from "@/lib/services";
import { fmtMoney } from "@/lib/money";
import { FinancialSummary, monthlyFinancialSummaries } from "@/lib/financial";
import { ManagementPanel, OperationsColumn } from "@/lib/settingsSlice";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type FilterStatus = "all" | JobStatus;
type FilterService = "all" | ServiceKey;

const PIPELINE_STAGES: { label: string; color: string; statuses: JobStatus[]; matches: (record: JobRecord) => boolean }[] = [
  { label: "New job", color: "#94A3B8", statuses: ["enquiry"], matches: (record) => record.status === "enquiry" },
  { label: "Quotation", color: "#3B82F6", statuses: ["quotation_sent"], matches: (record) => record.quotationPrinted },
  { label: "Waiting approval", color: "#6366F1", statuses: ["quotation_sent"], matches: (record) => record.status === "quotation_sent" },
  { label: "Approved", color: "#0891B2", statuses: ["approved"], matches: (record) => record.status === "approved" },
  { label: "Rejected", color: "#B91C1C", statuses: ["request_closed"], matches: (record) => record.status === "request_closed" },
  { label: "Invoice", color: "#F59E0B", statuses: ["invoiced"], matches: (record) => record.status === "invoiced" },
  { label: "Partially paid", color: "#F97316", statuses: ["partially_paid"], matches: (record) => record.status === "partially_paid" },
  { label: "Fully paid", color: "#059669", statuses: ["paid"], matches: (record) => record.status === "paid" },
  { label: "Completed", color: "#334155", statuses: ["closed"], matches: (record) => record.status === "closed" },
];

export default function ManagementDashboard({
  records,
  businessExpenses,
  financialSummary,
  activeStatus,
  activeService,
  onStatusSelect,
  onServiceSelect,
  managementPanels: _managementPanels,
  operationsColumns: _operationsColumns,
  visibleStatuses: _visibleStatuses,
}: {
  records: JobRecord[];
  businessExpenses: BusinessExpense[];
  financialSummary: FinancialSummary;
  activeStatus: FilterStatus;
  activeService: FilterService;
  onStatusSelect: (status: FilterStatus) => void;
  onServiceSelect: (service: FilterService) => void;
  managementPanels: ManagementPanel[];
  operationsColumns: OperationsColumn[];
  visibleStatuses: JobStatus[];
}) {
  const pipelineData = PIPELINE_STAGES.map((stage) => ({
    ...stage,
    value: records.filter(stage.matches).length,
  }));
  const financialTrend = monthlyFinancialSummaries(records, businessExpenses).map((summary) => ({
    ...summary,
    label: new Date(`${summary.month}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
    expenses: summary.jobExpenses + summary.businessExpenses,
  }));
  const paymentData = {
    invoiced: financialSummary.revenue,
    paid: financialSummary.paidAmount,
    outstanding: financialSummary.outstandingAmount,
  };
  const paymentBars = [
    { label: "Invoiced", value: paymentData.invoiced, color: "#0F8B8D" },
    { label: "Paid", value: paymentData.paid, color: "#059669" },
    { label: "Outstanding", value: paymentData.outstanding, color: "#F59E0B" },
  ];
  const activeFilterLabel = activeStatus === "all" && activeService === "all"
    ? "All jobs"
    : `${activeService === "all" ? "All services" : SERVICES[activeService].label} · ${activeStatus === "all" ? "All statuses" : activeStatus.replaceAll("_", " ")}`;

  return (
    <section className="flex flex-col gap-4" aria-label="Business dashboard insights">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-water">Business overview</p>
          <h2 className="font-display text-2xl font-bold text-deep">Jobs and money at a glance</h2>
        </div>
        <button className={`btn-outline text-xs ${activeStatus === "all" && activeService === "all" ? "invisible" : ""}`} onClick={() => { onStatusSelect("all"); onServiceSelect("all"); }}>
          Clear filters
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="panel p-4 xl:col-span-2">
          <div className="mb-3"><h3 className="font-display font-bold text-deep">Job pipeline</h3><p className="text-xs text-muted">Click a stage to focus the job register.</p></div>
          {records.length ? <div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={pipelineData} layout="vertical" margin={{ top: 0, right: 12, left: 10, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#D8DDD9" /><XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} /><YAxis dataKey="label" type="category" width={100} tick={{ fontSize: 10 }} /><Tooltip formatter={(value) => [`${value}`, "Jobs"]} /><Bar dataKey="value" name="Jobs" radius={[0, 4, 4, 0]} onClick={(data) => { const status = (data as unknown as { statuses?: JobStatus[] }).statuses?.[0]; if (status) onStatusSelect(status); }}>{pipelineData.map((stage) => <Cell key={stage.label} fill={stage.color} />)}</Bar></BarChart></ResponsiveContainer></div> : <EmptyState text="No jobs yet. Create a new job to start the pipeline." />}
        </div>

        <div className="panel p-4">
          <div className="mb-3"><h3 className="font-display font-bold text-deep">Payment overview</h3><p className="text-xs text-muted">Cash received is separate from profit.</p></div>
          {paymentData.invoiced > 0 ? <div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={paymentBars} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#D8DDD9" /><XAxis dataKey="label" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 9 }} tickFormatter={(value) => `₹${fmtMoney(Number(value) || 0)}`} width={58} /><Tooltip formatter={(value) => `₹${fmtMoney(Number(value) || 0)}`} /><Bar dataKey="value" name="Amount" radius={[4, 4, 0, 0]}>{paymentBars.map((item) => <Cell key={item.label} fill={item.color} />)}</Bar></BarChart></ResponsiveContainer></div> : <EmptyState text="No invoices yet. Payment information will appear here after invoicing." />}
        </div>
      </div>

      <div className="panel p-4">
        <div className="mb-3"><h3 className="font-display font-bold text-deep">Financial trend</h3><p className="text-xs text-muted">Monthly revenue, total expenses, and profit from actual records.</p></div>
        {financialTrend.length ? <div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={financialTrend} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#D8DDD9" /><XAxis dataKey="label" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 9 }} tickFormatter={(value) => `₹${fmtMoney(Number(value) || 0)}`} width={58} /><Tooltip formatter={(value) => `₹${fmtMoney(Number(value) || 0)}`} /><Legend wrapperStyle={{ fontSize: 11 }} /><Line type="monotone" dataKey="revenue" name="Revenue" stroke="#0F8B8D" strokeWidth={3} dot={{ r: 3 }} /><Line type="monotone" dataKey="expenses" name="Expenses" stroke="#D9622B" strokeWidth={3} dot={{ r: 3 }} /><Line type="monotone" dataKey="netProfit" name="Net profit" stroke="#334155" strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div> : <EmptyState text="No dated invoice or expense activity yet." />}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs"><span className="font-semibold text-muted">Register view:</span><span className="font-bold text-deep">{activeFilterLabel}</span><span className="text-muted">({records.length} jobs)</span></div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="flex h-[280px] items-center justify-center text-center text-sm text-muted">{text}</div>;
}
