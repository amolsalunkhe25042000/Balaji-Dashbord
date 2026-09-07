"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { selectAllRecords } from "@/lib/recordsSlice";
import { computeTotals, fmtMoney } from "@/lib/money";
import { JobStatus, ServiceKey } from "@/lib/types";
import StatCard from "@/components/StatCard";
import RecentWork from "@/components/RecentWork";
import CustomerTable from "@/components/CustomerTable";
import ManagementDashboard from "@/components/ManagementDashboard";
import EnquiryRegister from "@/components/EnquiryRegister";

export default function DashboardPage() {
  const records = useAppSelector(selectAllRecords);
  const [activeStatus, setActiveStatus] = useState<"all" | JobStatus>("all");
  const [activeService, setActiveService] = useState<"all" | ServiceKey>("all");

  const totalJobs = records.length;
  const closed = records.filter((r) => r.status === "closed").length;
  const paid = records.filter((r) => r.status === "paid").length;
  const pending = records.filter((r) => r.status === "invoiced" || r.status === "partially_paid").length;
  const closedRequests = records.filter((r) => r.status === "request_closed").length;
  const enquiries = records.filter((r) => r.status === "enquiry");

  const totalCollected = records.reduce((sum, r) => sum + computeTotals(r).paidAmount, 0);
  const totalPendingAmount = records.reduce((sum, r) => sum + computeTotals(r).balanceDue, 0);
  const completeWork = closed + paid;
  const visibleRecords = useMemo(
    () =>
      records.filter(
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
          <h1 className="text-xl font-display font-bold text-deep">Dashboard</h1>
          <p className="text-sm text-muted">Overview of every enquiry, quotation and invoice.</p>
        </div>
        <Link href="/new" className="btn-primary">
          + New job
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <StatCard label="Total jobs" value={String(totalJobs)} />
        <StatCard label="Customer enquiries" value={String(enquiries.length)} tone="warn" sub="Saved, not moved forward" />
        <StatCard label="Pending payment" value={String(pending)} tone="warn" />
        <StatCard label="Complete work" value={String(completeWork)} tone="good" sub={`${paid} paid · ${closed} closed`} />
        <StatCard label="Closed requests" value={String(closedRequests)} tone="bad" sub="Did not start work" />
        <StatCard label="Total collected" value={`₹ ${fmtMoney(totalCollected)}`} tone="good" />
        <StatCard label="Total pending amount" value={`₹ ${fmtMoney(totalPendingAmount)}`} tone="bad" />
      </div>

      <ManagementDashboard
        records={records}
        activeStatus={activeStatus}
        activeService={activeService}
        onStatusSelect={setActiveStatus}
        onServiceSelect={setActiveService}
      />
      <EnquiryRegister records={enquiries} />
      <RecentWork records={visibleRecords} />
      <CustomerTable records={visibleRecords} />
    </div>
  );
}
