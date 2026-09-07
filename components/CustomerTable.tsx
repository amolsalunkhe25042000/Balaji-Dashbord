"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppDispatch } from "@/lib/hooks";
import { JobRecord, JobStatus } from "@/lib/types";
import { SERVICES } from "@/lib/services";
import { computeTotals, fmtMoney, formatDate } from "@/lib/money";
import { setStatus } from "@/lib/recordsSlice";
import StatusBadge from "./StatusBadge";

const FILTERS: { key: "all" | JobStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "enquiry", label: "Enquiry" },
  { key: "quotation_sent", label: "Quotation sent" },
  { key: "invoiced", label: "Pending" },
  { key: "partially_paid", label: "Partially paid" },
  { key: "paid", label: "Paid" },
  { key: "closed", label: "Closed" },
  { key: "request_closed", label: "Request closed" },
];

export default function CustomerTable({ records }: { records: JobRecord[] }) {
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | JobStatus>("all");

  const filtered = useMemo(() => {
    return [...records]
      .filter((r) => (filter === "all" ? true : r.status === filter))
      .filter((r) => r.customer.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [records, filter, query]);

  return (
    <div className="panel">
      <div className="panel-head flex-wrap gap-2">
        <h2>All customers &amp; jobs</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            className="field-input !w-40 sm:!w-56 text-sm"
            placeholder="Search customer…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select className="field-input !w-auto text-sm" value={filter} onChange={(e) => setFilter(e.target.value as any)}>
            {FILTERS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted border-b border-line">
              <th className="px-4 py-2.5">Customer</th>
              <th className="px-4 py-2.5">Service</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Total</th>
              <th className="px-4 py-2.5 text-right">Paid</th>
              <th className="px-4 py-2.5 text-right">Balance</th>
              <th className="px-4 py-2.5">Updated</th>
              <th className="px-4 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-muted text-sm">
                  No matching jobs.
                </td>
              </tr>
            )}
            {filtered.map((r) => {
              const svc = SERVICES[r.service];
              const totals = computeTotals(r);
              return (
                <tr key={r.id} className="border-b border-panel hover:bg-panel/60">
                  <td className="px-4 py-2.5 font-medium">{r.customer.name || "Unnamed"}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-semibold" style={{ color: svc.accentHex }}>
                      {svc.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">₹ {fmtMoney(totals.total)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-emerald-700">₹ {fmtMoney(totals.paidAmount)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-red-600">₹ {fmtMoney(totals.balanceDue)}</td>
                  <td className="px-4 py-2.5 text-xs text-muted">{formatDate(r.updatedAt.slice(0, 10))}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-2 flex-wrap">
                      <Link href={`/record/${r.id}/quotation`} className="text-water text-xs font-semibold hover:underline">
                        Quotation
                      </Link>
                      {r.invoiceCreated && (
                        <Link href={`/record/${r.id}/invoice`} className="text-deep text-xs font-semibold hover:underline">
                          Invoice
                        </Link>
                      )}
                      {(r.status === "enquiry" || r.status === "quotation_sent" || r.status === "request_closed") && (
                        <button
                          className="text-xs font-semibold text-red-700 hover:underline"
                          onClick={() =>
                            dispatch(
                              setStatus({
                                id: r.id,
                                status: r.status === "request_closed" ? "quotation_sent" : "request_closed",
                              })
                            )
                          }
                        >
                          {r.status === "request_closed" ? "Reopen" : "Close request"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
