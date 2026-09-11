"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { selectAllRecords } from "@/lib/recordsSlice";
import { fmtMoney, isApprovedWork } from "@/lib/money";
import { selectFinancialSummary } from "@/lib/financial";
import { JobStatus, ServiceKey } from "@/lib/types";
import StatCard from "@/components/StatCard";
import RecentWork from "@/components/RecentWork";
import ManagementDashboard from "@/components/ManagementDashboard";

export default function DashboardPage() {
  const records = useAppSelector(selectAllRecords);
  const dashboardWidgets = useAppSelector((state) => state.settings.dashboardWidgets);
  const managementPanels = useAppSelector((state) => state.settings.managementPanels);
  const operationsColumns = useAppSelector((state) => state.settings.operationsColumns);
  const visibleStatuses = useAppSelector((state) => state.settings.visibleStatuses);
  const brandingName = useAppSelector((state) => state.settings.brandingName);
  const businessExpenses = useAppSelector((state) => state.records.businessExpenses || []);
  const financialSummary = useAppSelector(selectFinancialSummary);
  const [activeStatus, setActiveStatus] = useState<"all" | JobStatus>("all");
  const [activeService, setActiveService] = useState<"all" | ServiceKey>("all");

  const totalJobs = records.length;
  const activeJobs = records.filter((r) => !["closed", "request_closed"].includes(r.status)).length;
  const closed = records.filter((r) => r.status === "closed").length;
  const pendingApproval = records.filter((r) => r.status === "quotation_sent").length;
  const visibleRecords = useMemo(
    () =>
      records.filter(isApprovedWork).filter(
        (record) =>
          (activeStatus === "all" || record.status === activeStatus) &&
          (activeService === "all" || record.service === activeService)
      ),
    [records, activeService, activeStatus]
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-display font-bold text-deep">{brandingName} Dashboard</h1>
          <p className="text-sm text-muted">Overview of every enquiry, quotation and invoice.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/approved" className="btn-primary text-xs">
            Approved customers &amp; jobs
          </Link>
          <Link href="/visits" className="btn-outline text-xs">
            Customer visits &amp; approval queue
          </Link>
          <Link href="/new" className="btn-outline text-xs">
            + New visit
          </Link>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-xl bg-deep px-5 py-5 text-white shadow-sm sm:px-7 sm:py-6" aria-label="Create a new job">
        <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full border-[20px] border-[#0F8B8D]/35" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-12 right-28 h-28 w-28 rounded-full border-[14px] border-[#D9622B]/25" aria-hidden="true" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9FD3D2]">New customer?</p>
            <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Start a new job</h2>
            <p className="mt-1 max-w-xl text-sm text-[#D8ECEB]">Capture the customer, site, work details, and quotation in one place.</p>
          </div>
          <Link href="/new" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-deep shadow-sm transition hover:bg-[#E7F3F2] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-deep">
            <span className="text-xl leading-none" aria-hidden="true">+</span>
            Create New Job
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-label="Key performance indicators">
        <div><h2 className="font-display text-lg font-bold text-deep">Jobs</h2><p className="text-xs text-muted">Work that needs attention and work completed.</p></div>
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total jobs" value={String(totalJobs)} />
          <StatCard label="Active jobs" value={String(activeJobs)} tone="warn" />
          <StatCard label="Pending approval" value={String(pendingApproval)} tone="warn" sub="Quotation sent" />
          <StatCard label="Completed jobs" value={String(closed)} tone="good" />
        </div>
        <div><h2 className="font-display text-lg font-bold text-deep">Finance</h2><p className="text-xs text-muted">Invoice value, cash received, and money still due.</p></div>
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 md:grid-cols-3">
          <StatCard label="Total invoiced" value={`₹ ${fmtMoney(financialSummary.revenue)}`} />
          <StatCard label="Total paid" value={`₹ ${fmtMoney(financialSummary.paidAmount)}`} tone="good" />
          <StatCard label="Outstanding" value={`₹ ${fmtMoney(financialSummary.outstandingAmount)}`} tone="bad" />
        </div>
        <div><h2 className="font-display text-lg font-bold text-deep">Profit</h2><p className="text-xs text-muted">Profit is revenue minus expenses, not cash received.</p></div>
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Job expenses" value={`₹ ${fmtMoney(financialSummary.jobExpenses)}`} tone="warn" />
          <StatCard label="Gross profit" value={`₹ ${fmtMoney(financialSummary.grossProfit)}`} tone={financialSummary.grossProfit >= 0 ? "good" : "bad"} />
          <StatCard label="Business expenses" value={`₹ ${fmtMoney(financialSummary.businessExpenses)}`} tone="warn" />
          <StatCard label="Net profit" value={`₹ ${fmtMoney(financialSummary.netProfit)}`} tone={financialSummary.netProfit >= 0 ? "good" : "bad"} />
        </div>
      </section>

      {dashboardWidgets.includes("managementDashboard") && <ManagementDashboard
        records={records}
        businessExpenses={businessExpenses}
        financialSummary={financialSummary}
        activeStatus={activeStatus}
        activeService={activeService}
        onStatusSelect={setActiveStatus}
        onServiceSelect={setActiveService}
        managementPanels={managementPanels}
        operationsColumns={operationsColumns}
        visibleStatuses={visibleStatuses}
      />}
      {dashboardWidgets.includes("recentWork") && <RecentWork records={visibleRecords} />}
    </div>
  );
}
