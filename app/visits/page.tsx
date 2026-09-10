"use client";

import EnquiryRegister from "@/components/EnquiryRegister";
import { useAppSelector } from "@/lib/hooks";
import { selectAllRecords } from "@/lib/recordsSlice";

export default function CustomerVisitsPage() {
  const records = useAppSelector(selectAllRecords);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-display font-bold text-deep">Customer visits &amp; approval queue</h1>
        <p className="text-sm text-muted">Track new enquiries, quotations awaiting approval, and requests that were closed without starting work.</p>
      </div>
      <EnquiryRegister records={records} />
    </div>
  );
}
