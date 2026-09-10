"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { selectAllRecords } from "@/lib/recordsSlice";
import { computeTotals, fmtMoney, isApprovedWork, isInvoiceRecord } from "@/lib/money";
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
  const [activeStatus, setActiveStatus] = useState<"all" | JobStatus>("all");
  const [activeService, setActiveService] = useState<"all" | ServiceKey>("all");

  const totalJobs = records.length;
  const closed = records.filter((r) => r.status === "closed").length;
  const paid = records.filter((r) => r.status === "paid").length;
  const pending = records.filter((r) => r.status === "invoiced" || r.status === "partially_paid").length;
  const closedRequests = records.filter((r) => r.status === "request_closed").length;
  const enquiries = records.filter((r) => r.status === "enquiry");
  const customerVisits = records.filter((r) => r.status === "enquiry" || r.status === "request_closed").length;
  const pendingApproval = records.filter((r) => r.status === "enquiry" || r.status === "quotation_sent").length;
  const invoiceRecords = records.filter(isInvoiceRecord);

  const totalCollected = invoiceRecords.reduce((sum, r) => sum + computeTotals(r).paidAmount, 0);
  const totalPendingAmount = invoiceRecords
    .filter((r) => r.status === "invoiced" || r.status === "partially_paid")
    .reduce((sum, r) => sum + computeTotals(r).balanceDue, 0);
  const completeWork = closed + paid;
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

      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {dashboardWidgets.includes("totalJobs") && <StatCard label="Total jobs" value={String(totalJobs)} />}
        {dashboardWidgets.includes("customerVisits") && <StatCard label="Customer visits" value={String(customerVisits)} tone="warn" sub={`${enquiries.length} waiting · ${closedRequests} rejected`} />}
        {dashboardWidgets.includes("pendingApproval") && <StatCard label="Pending approval" value={String(pendingApproval)} tone="warn" sub="Enquiry or quotation sent" />}
        {dashboardWidgets.includes("pendingPayment") && <StatCard label="Pending payment" value={String(pending)} tone="warn" />}
        {dashboardWidgets.includes("completeWork") && <StatCard label="Complete work" value={String(completeWork)} tone="good" sub={`${paid} paid · ${closed} closed`} />}
        {dashboardWidgets.includes("closedRequests") && <StatCard label="Closed requests" value={String(closedRequests)} tone="bad" sub="Did not start work" />}
        {dashboardWidgets.includes("totalCollected") && <StatCard label="Total collected" value={`₹ ${fmtMoney(totalCollected)}`} tone="good" />}
        {dashboardWidgets.includes("totalPendingAmount") && <StatCard label="Total pending amount" value={`₹ ${fmtMoney(totalPendingAmount)}`} tone="bad" />}
      </div>

      {dashboardWidgets.includes("managementDashboard") && <ManagementDashboard
        records={records}
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
