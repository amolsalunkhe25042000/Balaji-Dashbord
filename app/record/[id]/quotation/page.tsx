"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { selectRecordById, commitNextNumber, patchRecord, setStatus } from "@/lib/recordsSlice";
import { RootState } from "@/lib/store";
import DocumentPreview from "@/components/DocumentPreview";
import StatusBadge from "@/components/StatusBadge";

export default function QuotationPage({ params }: { params: { id: string } }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const record = useAppSelector((s: RootState) => selectRecordById(s, params.id));

  if (!record) {
    return (
      <div className="panel p-6 text-center">
        <p className="text-muted mb-3">This job could not be found — it may have been deleted, or the data hasn&rsquo;t loaded yet.</p>
        <Link href="/" className="btn-outline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const goToInvoice = () => {
    router.push(`/record/${record.id}/invoice`);
  };

  const reprint = () => {
    // still print-anytime; only bump the number if this quotation was never actually printed
    if (!record.quotationPrinted) {
      const quotationNo = dispatch(commitNextNumber(record.service, "quotation"));
      dispatch(patchRecord({ id: record.id, patch: { quotationNo, quotationPrinted: true, status: "quotation_sent" } }));
    }
    setTimeout(() => window.print(), 80);
  };

  const toggleRequestClosed = () => {
    dispatch(
      setStatus({
        id: record.id,
        status: record.status === "request_closed" ? "quotation_sent" : "request_closed",
      })
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="no-print flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-display font-bold text-deep">Quotation — {record.customer.name || "Unnamed customer"}</h1>
            <p className="text-sm text-muted">{record.quotationNo || "Not yet numbered"}</p>
          </div>
          <StatusBadge status={record.status} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/" className="btn-outline">
            ← Dashboard
          </Link>
          <button className="btn-outline" onClick={reprint}>
            Print quotation
          </button>
          <button className="btn-outline text-red-700" onClick={toggleRequestClosed}>
            {record.status === "request_closed" ? "Reopen request" : "Close request"}
          </button>
          {record.status !== "request_closed" && (
            <button className="btn-primary" onClick={goToInvoice}>
              {record.invoiceCreated ? "Go to invoice →" : "Create invoice →"}
            </button>
          )}
        </div>
      </div>

      <DocumentPreview record={record} mode="quotation" />
    </div>
  );
}
