"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppSelector } from "@/lib/hooks";
import { selectAllRecords } from "@/lib/recordsSlice";
import { selectFinancialSummary } from "@/lib/financial";
import { fmtMoney, formatDate } from "@/lib/money";
import { SERVICES } from "@/lib/services";
import { ExpenseCategory } from "@/lib/types";
import { JOB_EXPENSE_CATEGORIES } from "@/lib/expenseCategories";
import { dateInRange, expenseRows, filterRecordsByDate, jobProfitabilityRows, monthlyReportRows, ReportRange, reportFinancialSummary, resolveDateRange, revenueRows } from "@/lib/reporting";
import { downloadReportWorkbook } from "@/lib/reportExport";
import StatusBadge from "@/components/StatusBadge";
import ProtectedPage from "@/components/ProtectedPage";

const JOB_CATEGORIES: ExpenseCategory[] = JOB_EXPENSE_CATEGORIES;
const EXPENSE_TYPES = ["all", "Job Expense", "Business Expense"] as const;
const SORT_OPTIONS = ["profit_desc", "profit_asc", "revenue_desc", "expense_desc", "margin_desc", "outstanding_desc"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

export default function ReportsPage() {
  const records = useAppSelector(selectAllRecords);
  const businessExpenses = useAppSelector((state) => state.records.businessExpenses || []);
  const allTimeSummary = useAppSelector(selectFinancialSummary);
  const [range, setRange] = useState<ReportRange>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [expenseType, setExpenseType] = useState<(typeof EXPENSE_TYPES)[number]>("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortOption>("profit_desc");

  const dateRange = resolveDateRange(range, customStart, customEnd);
  const summary = useMemo(() => range === "all" ? allTimeSummary : reportFinancialSummary(records, businessExpenses, dateRange), [allTimeSummary, businessExpenses, dateRange, range, records]);
  const revenue = useMemo(() => revenueRows(records, dateRange).filter((row) => matchesSearch(`${row.record.customer.name} ${row.record.id} ${row.record.invoiceNo}`) && (status === "all" || row.record.status === status)), [dateRange, records, search, status]);
  const expenses = useMemo(() => expenseRows(records, businessExpenses, dateRange).filter((row) => (expenseType === "all" || row.type === expenseType) && (category === "all" || row.category === category) && matchesSearch(`${row.jobLabel} ${row.description} ${row.vendor} ${row.category}`)), [businessExpenses, category, dateRange, expenseType, records, search]);
  const profitability = useMemo(() => jobProfitabilityRows(records, dateRange).filter((row) => matchesSearch(`${row.record.customer.name} ${row.record.id}`) && (status === "all" || row.record.status === status)).sort((a, b) => {
    if (sort === "profit_asc") return a.grossProfit - b.grossProfit;
    if (sort === "revenue_desc") return b.revenue - a.revenue;
    if (sort === "expense_desc") return b.jobExpenses - a.jobExpenses;
    if (sort === "margin_desc") return b.profitMargin - a.profitMargin;
    if (sort === "outstanding_desc") return b.outstandingAmount - a.outstandingAmount;
    return b.grossProfit - a.grossProfit;
  }), [dateRange, records, search, sort, status]);
  const outstanding = revenue.filter((row) => row.outstandingAmount > 0);
  const monthly = useMemo(() => monthlyReportRows(records, businessExpenses, dateRange), [businessExpenses, dateRange, records]);
  const filteredRecords = filterRecordsByDate(records, dateRange);
  const hasDateError = range === "custom" && customStart && customEnd && customStart > customEnd;

  function matchesSearch(value: string) {
    return value.toLowerCase().includes(search.trim().toLowerCase());
  }

  function printReport() {
    window.print();
  }

  function exportExcel() {
    downloadReportWorkbook({ summary, records: filteredRecords, revenue, expenses, profitability });
  }

  return (
    <ProtectedPage title="Reports" description="Review revenue, payments, expenses, profitability, and outstanding balances.">
      <div className="no-print flex flex-wrap items-end justify-between gap-3 mb-5">
        <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-water">Business intelligence</p><h1 className="text-2xl font-display font-bold text-deep">Reports</h1><p className="text-sm text-muted">Live reports from jobs, invoices, payments, and expenses.</p></div>
        <div className="flex flex-wrap gap-2"><Link href="/" className="btn-outline text-xs">Dashboard</Link><button type="button" className="btn-outline text-xs" onClick={exportExcel}>Export Excel</button><button type="button" className="btn-primary text-xs" onClick={printReport}>Print report</button></div>
      </div>

      <section className="no-print panel p-4 mb-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div><label className="field-label" htmlFor="report-range">Date range</label><select id="report-range" className="field-input" value={range} onChange={(event) => setRange(event.target.value as ReportRange)}><option value="all">All time</option><option value="today">Today</option><option value="week">This week</option><option value="month">This month</option><option value="year">This year</option><option value="custom">Custom range</option></select></div>
          {range === "custom" && <><div><label className="field-label" htmlFor="report-start">From</label><input id="report-start" className="field-input" type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></div><div><label className="field-label" htmlFor="report-end">To</label><input id="report-end" className="field-input" type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></div></>}
          <div><label className="field-label" htmlFor="report-search">Search</label><input id="report-search" className="field-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Customer, job, invoice" /></div>
          <div><label className="field-label" htmlFor="report-status">Status</label><select id="report-status" className="field-input" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{[...new Set(records.map((record) => record.status))].map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></div>
        </div>
        {hasDateError && <p className="mt-3 text-xs font-semibold text-red-600">The end date must be on or after the start date.</p>}
      </section>

      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 mb-5">
        <ReportMetric label="Revenue" value={summary.revenue} /><ReportMetric label="Paid" value={summary.paidAmount} tone="good" /><ReportMetric label="Outstanding" value={summary.outstandingAmount} tone="bad" /><ReportMetric label="Job expenses" value={summary.jobExpenses} tone="warn" /><ReportMetric label="Business expenses" value={summary.businessExpenses} tone="warn" /><ReportMetric label="Gross profit" value={summary.grossProfit} tone={summary.grossProfit >= 0 ? "good" : "bad"} /><ReportMetric label="Net profit" value={summary.netProfit} tone={summary.netProfit >= 0 ? "good" : "bad"} /><ReportMetric label="Margin" value={summary.profitMargin} suffix="%" tone={summary.profitMargin >= 0 ? "good" : "bad"} />
      </div>

      <section className="panel p-4 mb-5"><div className="mb-3"><h2 className="font-display text-xl font-bold text-deep">Monthly financial trend</h2><p className="text-xs text-muted">Revenue, expenses, and net profit for the selected range.</p></div>{monthly.length ? <div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={monthly}><CartesianGrid strokeDasharray="3 3" stroke="#D8DDD9" /><XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 9 }} tickFormatter={(value) => `₹${fmtMoney(Number(value) || 0)}`} width={58} /><Tooltip formatter={(value) => `₹${fmtMoney(Number(value) || 0)}`} /><Legend wrapperStyle={{ fontSize: 11 }} /><Line dataKey="revenue" name="Revenue" stroke="#0F8B8D" strokeWidth={3} /><Line dataKey="jobExpenses" name="Job expenses" stroke="#D9622B" strokeWidth={3} /><Line dataKey="businessExpenses" name="Business expenses" stroke="#B7791F" strokeWidth={3} /><Line dataKey="netProfit" name="Net profit" stroke="#334155" strokeWidth={3} /></LineChart></ResponsiveContainer></div> : <EmptyState text="No dated financial activity in this range." />}</section>

      <section className="panel overflow-hidden mb-5"><ReportHeading title="Revenue report" detail={`${revenue.length} invoices`} /><div className="overflow-x-auto"><table className="report-table"><thead><tr><th>Invoice</th><th>Customer / job</th><th>Date</th><th className="text-right">Invoice</th><th className="text-right">Paid</th><th className="text-right">Outstanding</th><th>Status</th></tr></thead><tbody>{revenue.map((row) => <tr key={row.record.id}><td>{row.record.invoiceNo || "—"}</td><td><span className="font-semibold text-deep">{row.record.customer.name || "Unnamed customer"}</span><span className="block text-[11px] text-muted">{row.record.id}</span></td><td>{formatDate(row.record.invoiceDate)}</td><td className="text-right font-mono">₹{fmtMoney(row.invoiceAmount)}</td><td className="text-right font-mono text-water">₹{fmtMoney(row.paidAmount)}</td><td className="text-right font-mono text-paint">₹{fmtMoney(row.outstandingAmount)}</td><td><StatusBadge status={row.record.status} /></td></tr>)}</tbody></table>{!revenue.length && <EmptyState text="No invoices match the selected filters." />}</div></section>

      <section className="panel overflow-hidden mb-5"><ReportHeading title="Expense report" detail={`${expenses.length} expenses`} /><div className="no-print flex flex-wrap gap-2 px-4 pb-3"><select className="field-input !w-auto text-xs" value={expenseType} onChange={(event) => setExpenseType(event.target.value as (typeof EXPENSE_TYPES)[number])}>{EXPENSE_TYPES.map((item) => <option key={item} value={item}>{item === "all" ? "All expense types" : item}</option>)}</select><select className="field-input !w-auto text-xs" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{JOB_CATEGORIES.map((item) => <option key={item} value={item}>{item.replace("_", " ")}</option>)}{businessExpenses.map((item) => <option key={`business-${item.category}`} value={item.category}>{item.category}</option>)}</select></div><div className="overflow-x-auto"><table className="report-table"><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Job / business</th><th>Description</th><th>Vendor</th><th>Payment method</th><th className="text-right">Amount</th></tr></thead><tbody>{expenses.map((row, index) => <tr key={`${row.type}-${row.date}-${row.amount}-${index}`}><td>{formatDate(row.date)}</td><td>{row.type}</td><td>{row.category.replace("_", " ")}</td><td>{row.jobLabel}</td><td>{row.description}</td><td>{row.vendor || "—"}</td><td>{row.paymentMethod || "—"}</td><td className="text-right font-mono">₹{fmtMoney(row.amount)}</td></tr>)}</tbody></table>{!expenses.length && <EmptyState text="No expenses match the selected filters." />}</div></section>

      <section className="panel overflow-hidden mb-5"><div className="panel-head"><div><h2>Job profitability</h2><p className="mt-1 text-[11px] normal-case tracking-normal text-muted">Paid amount is cash received; profit is revenue minus job expenses.</p></div><select className="field-input !w-auto text-xs" value={sort} onChange={(event) => setSort(event.target.value as SortOption)}>{SORT_OPTIONS.map((item) => <option key={item} value={item}>{item === "profit_desc" ? "Highest profit" : item === "profit_asc" ? "Lowest profit" : item === "revenue_desc" ? "Highest revenue" : item === "expense_desc" ? "Highest expenses" : item === "margin_desc" ? "Highest margin" : "Highest outstanding"}</option>)}</select></div><div className="overflow-x-auto"><table className="report-table min-w-[980px]"><thead><tr><th>Job / customer</th><th>Status</th><th className="text-right">Revenue</th><th className="text-right">Job expenses</th><th className="text-right">Gross profit</th><th className="text-right">Margin</th><th className="text-right">Paid</th><th className="text-right">Outstanding</th></tr></thead><tbody>{profitability.map((row) => <tr key={row.record.id}><td><span className="font-semibold text-deep">{row.record.customer.name || "Unnamed customer"}</span><span className="block text-[11px] text-muted">{row.record.id} · {SERVICES[row.record.service].label}</span></td><td><StatusBadge status={row.record.status} /></td><td className="text-right font-mono">₹{fmtMoney(row.revenue)}</td><td className="text-right font-mono">₹{fmtMoney(row.jobExpenses)}</td><td className={`text-right font-mono ${row.grossProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>₹{fmtMoney(row.grossProfit)}</td><td className="text-right font-mono">{Number.isFinite(row.profitMargin) ? `${row.profitMargin.toFixed(1)}%` : "0.0%"}</td><td className="text-right font-mono">₹{fmtMoney(row.paidAmount)}</td><td className="text-right font-mono">₹{fmtMoney(row.outstandingAmount)}</td></tr>)}</tbody></table>{!profitability.length && <EmptyState text="No jobs match the selected filters." />}</div></section>

      <section className="panel overflow-hidden"><ReportHeading title="Outstanding payments" detail={`${outstanding.length} open invoices`} /><div className="overflow-x-auto"><table className="report-table"><thead><tr><th>Customer / job</th><th>Invoice</th><th>Invoice date</th><th className="text-right">Invoice amount</th><th className="text-right">Paid</th><th className="text-right">Outstanding</th><th>Status</th></tr></thead><tbody>{outstanding.map((row) => <tr key={row.record.id}><td>{row.record.customer.name || "Unnamed customer"}<span className="block text-[11px] text-muted">{row.record.id}</span></td><td>{row.record.invoiceNo || "—"}</td><td>{formatDate(row.record.invoiceDate)}</td><td className="text-right font-mono">₹{fmtMoney(row.invoiceAmount)}</td><td className="text-right font-mono">₹{fmtMoney(row.paidAmount)}</td><td className="text-right font-mono font-semibold text-paint">₹{fmtMoney(row.outstandingAmount)}</td><td><StatusBadge status={row.record.status} /></td></tr>)}</tbody></table>{!outstanding.length && <EmptyState text="No outstanding payments in this range." />}</div></section>

      <p className="no-print mt-3 text-xs text-muted">{filteredRecords.length} records considered for the selected date range. Reports use the same local Redux data as the dashboard and finance page.</p>
    </ProtectedPage>
  );
}

function ReportMetric({ label, value, suffix = "", tone = "default" }: { label: string; value: number; suffix?: string; tone?: "default" | "good" | "warn" | "bad" }) {
  const color = tone === "good" ? "text-emerald-700" : tone === "warn" ? "text-amber-700" : tone === "bad" ? "text-red-700" : "text-deep";
  return <div className="panel p-3"><p className="text-[11px] uppercase tracking-wide text-muted">{label}</p><p className={`mt-2 font-display text-lg font-bold ${color}`}>{suffix ? `${Number.isFinite(value) ? value.toFixed(1) : "0.0"}${suffix}` : `₹ ${fmtMoney(Number.isFinite(value) ? value : 0)}`}</p></div>;
}

function ReportHeading({ title, detail }: { title: string; detail: string }) {
  return <div className="panel-head"><div><h2>{title}</h2><p className="mt-1 text-[11px] normal-case tracking-normal text-muted">{detail}</p></div></div>;
}

function EmptyState({ text }: { text: string }) {
  return <p className="px-4 py-8 text-center text-sm text-muted">{text}</p>;
}
