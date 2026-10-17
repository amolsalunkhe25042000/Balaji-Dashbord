"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { selectAllRecords } from "@/lib/recordsSlice";
import { fmtMoney } from "@/lib/money";
import { selectFinancialSummary } from "@/lib/financial";
import { JobStatus, ServiceKey } from "@/lib/types";
import StatCard from "@/components/StatCard";
import RecentWork from "@/components/RecentWork";
import ManagementDashboard from "@/components/ManagementDashboard";

export default function DashboardPage() {
  const records = useAppSelector(selectAllRecords);
  const dashboardWidgets = useAppSelector((state) => state.settings.dashboardWidgets);
  const brandingName = useAppSelector((state) => state.settings.brandingName);
  const financialSummary = useAppSelector(selectFinancialSummary);
  const [activeStatus, setActiveStatus] = useState<"all" | JobStatus>("all");
  const [activeService, setActiveService] = useState<"all" | ServiceKey>("all");

  const totalJobs = records.length;
  const closed = records.filter((r) => r.status === "closed").length;
  const enquiries = records.filter((r) => r.status === "enquiry").length;
  const pendingApproval = records.filter((r) => r.status === "quotation_sent").length;

  const filteredRecords = useMemo(() => {
    return records.filter((record) =>
      (activeStatus === "all" || record.status === activeStatus) &&
      (activeService === "all" || record.service === activeService)
    );
  }, [records, activeService, activeStatus]);
  const pipelineRecords = useMemo(
    () => activeService === "all" ? records : records.filter((record) => record.service === activeService),
    [activeService, records]
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-display font-bold text-deep">Balaji Painting & Waterproofing Service Dashboard</h1>
          <p className="text-sm text-muted">Overview of every enquiry, quotation and invoice.</p>
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
          <StatCard label="Total jobs" value={String(totalJobs)} active={activeStatus === "all" && activeService === "all"} onClick={() => { setActiveStatus("all"); setActiveService("all"); }} />
          <StatCard label="New enquiries" value={String(enquiries)} tone="warn" active={activeStatus === "enquiry"} onClick={() => setActiveStatus("enquiry")} />
          <StatCard label="Awaiting approval" value={String(pendingApproval)} tone="warn" active={activeStatus === "quotation_sent"} onClick={() => setActiveStatus("quotation_sent")} />
          <StatCard label="Work Done" value={String(closed)} tone="good" active={activeStatus === "closed"} onClick={() => setActiveStatus("closed")} />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div><h2 className="font-display text-lg font-bold text-deep">Money snapshot</h2><p className="text-xs text-muted">Invoice value, cash received, and money still due.</p></div>
          <Link href="/owner" className="text-xs font-semibold text-water hover:underline">Manage expenses and reports →</Link>
        </div>
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 md:grid-cols-3">
          <StatCard label="Total invoiced" value={`₹ ${fmtMoney(financialSummary.revenue)}`} />
          <StatCard label="Total paid" value={`₹ ${fmtMoney(financialSummary.paidAmount)}`} tone="good" />
          <StatCard label="Outstanding" value={`₹ ${fmtMoney(financialSummary.outstandingAmount)}`} tone="bad" />
        </div>
      </section>

      {dashboardWidgets.includes("managementDashboard") && <ManagementDashboard
        records={pipelineRecords}
        activeStatus={activeStatus}
        activeService={activeService}
        onStatusSelect={setActiveStatus}
        onServiceSelect={setActiveService}
        onClearFilters={() => { setActiveStatus("all"); setActiveService("all"); }}
      />}
      {dashboardWidgets.includes("recentWork") && <RecentWork records={filteredRecords} />}
    </div>
  );
}
