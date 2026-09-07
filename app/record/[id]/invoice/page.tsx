"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  selectRecordById,
  commitNextNumber,
  patchRecord,
  addPayment,
  removePayment,
  setStatus,
} from "@/lib/recordsSlice";
import { RootState } from "@/lib/store";
import { computeTotals } from "@/lib/money";
import DocumentPreview from "@/components/DocumentPreview";
import PaymentPanel from "@/components/PaymentPanel";
import StatusBadge from "@/components/StatusBadge";
import { Payment } from "@/lib/types";

export default function InvoicePage({ params }: { params: { id: string } }) {
  const dispatch = useAppDispatch();
  const record = useAppSelector((s: RootState) => selectRecordById(s, params.id));

  // Auto-create the invoice the moment this page is opened for a record that doesn't have one yet —
  // this is the "print quotation -> move to invoice page" handoff.
  useEffect(() => {
    if (record && !record.invoiceCreated) {
      const invoiceNo = dispatch(commitNextNumber(record.service, "invoice"));
      dispatch(
        patchRecord({
          id: record.id,
          patch: {
            invoiceNo,
            invoiceDate: new Date().toISOString().slice(0, 10),
            invoiceCreated: true,
            status: "invoiced",
          },
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record?.id, record?.invoiceCreated]);

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

  if (!record.invoiceCreated) {
    return <div className="panel p-6 text-center text-muted">Creating invoice…</div>;
  }

  const totals = computeTotals(record);

  const handleAddPayment = (payment: Payment) => {
    dispatch(addPayment({ id: record.id, payment }));
    const newPaid = totals.paidAmount + payment.amount;
    const nextStatus = newPaid >= totals.total ? "paid" : "partially_paid";
    dispatch(setStatus({ id: record.id, status: nextStatus }));
  };

  const handleRemovePayment = (paymentId: string) => {
    dispatch(removePayment({ id: record.id, paymentId }));
    const remaining = record.payments.filter((p) => p.id !== paymentId);
    const remainingPaid = remaining.reduce((s, p) => s + p.amount, 0);
    const nextStatus = remainingPaid <= 0 ? "invoiced" : remainingPaid >= totals.total ? "paid" : "partially_paid";
    dispatch(setStatus({ id: record.id, status: nextStatus }));
  };

  const closeJob = () => dispatch(setStatus({ id: record.id, status: "closed" }));
  const reopenJob = () => dispatch(setStatus({ id: record.id, status: totals.balanceDue > 0 ? "partially_paid" : "paid" }));

  return (
    <div className="flex flex-col gap-4">
      <div className="no-print flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-display font-bold text-deep">Invoice — {record.customer.name || "Unnamed customer"}</h1>
            <p className="text-sm text-muted">
              {record.invoiceNo} · Ref. quotation {record.quotationNo}
            </p>
          </div>
          <StatusBadge status={record.status} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/" className="btn-outline">
            ← Dashboard
          </Link>
          <Link href={`/record/${record.id}/quotation`} className="btn-outline">
            View quotation
          </Link>
          <button className="btn-outline" onClick={() => setTimeout(() => window.print(), 50)}>
            Print invoice
          </button>
          {record.status === "closed" ? (
            <button className="btn-outline" onClick={reopenJob}>
              Reopen job
            </button>
          ) : (
            totals.balanceDue <= 0 && (
              <button className="btn-primary" onClick={closeJob}>
                Mark job closed / complete
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 items-start">
        <div className="no-print flex flex-col gap-4">
          <PaymentPanel
            record={record}
            balanceDue={totals.balanceDue}
            onAddPayment={handleAddPayment}
            onRemovePayment={handleRemovePayment}
          />
        </div>
        <DocumentPreview record={record} mode="invoice" />
      </div>
    </div>
  );
}
