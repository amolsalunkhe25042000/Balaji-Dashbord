"use client";

import CustomerTable from "@/components/CustomerTable";
import { useAppSelector } from "@/lib/hooks";
import { selectAllRecords } from "@/lib/recordsSlice";
import { isApprovedWork } from "@/lib/money";

export default function ApprovedJobsPage() {
  const records = useAppSelector(selectAllRecords);
  const approvedRecords = records.filter(isApprovedWork);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-display font-bold text-deep">Approved customers &amp; jobs</h1>
        <p className="text-sm text-muted">All work that has passed the approval stage and is now tracked for invoicing and payment.</p>
      </div>
      <CustomerTable records={approvedRecords} />
    </div>
  );
}
