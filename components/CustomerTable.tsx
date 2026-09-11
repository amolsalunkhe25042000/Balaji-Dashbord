"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { useAppDispatch } from "@/lib/hooks";
import { JobRecord, JobStatus } from "@/lib/types";
import { SERVICES } from "@/lib/services";
import { computeTotals, fmtMoney, formatDate } from "@/lib/money";
import { setStatus } from "@/lib/recordsSlice";
import StatusBadge from "./StatusBadge";

type CustomerTableFilter = "all" | JobStatus;

const FILTERS: { key: CustomerTableFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "enquiry", label: "Enquiry" },
  { key: "quotation_sent", label: "Quotation sent" },
  { key: "approved", label: "Approved" },
  { key: "invoiced", label: "Pending" },
  { key: "partially_paid", label: "Partially paid" },
  { key: "paid", label: "Paid" },
  { key: "closed", label: "Closed" },
  { key: "request_closed", label: "Request closed" },
];

export default function CustomerTable({ records }: { records: JobRecord[] }) {
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CustomerTableFilter>("all");
  const [dateFilter, setDateFilter] = useState("");

  const filtered = useMemo(() => {
    return [...records]
      .filter((r) => (filter === "all" ? true : r.status === filter))
      .filter((r) => {
        const searchText = query.trim().toLowerCase();
        if (!searchText) return true;
        return [
          r.customer?.name,
          r.customer?.contact,
          r.quotationNo,
          r.invoiceNo,
          r.createdAt?.slice(0, 10),
          r.updatedAt?.slice(0, 10),
          r.quotationDate,
          r.invoiceDate,
        ].some((value) =>
          String(value ?? "").toLowerCase().includes(searchText)
        );
      })
      .filter((r) => {
        if (!dateFilter) return true;
        return [r.createdAt, r.updatedAt, r.quotationDate, r.invoiceDate].some((value) =>
          String(value ?? "").startsWith(dateFilter)
        );
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [records, filter, query, dateFilter]);

  const exportExcel = () => {
    const rows = filtered.map((record) => {
      const totals = computeTotals(record);
      return {
        "Customer name": record.customer.name || "Unnamed",
        Contact: record.customer.contact || "",
        Address: record.customer.address || "",
        Site: record.customer.site || "",
        Service: SERVICES[record.service].label,
        Status: record.status,
        "Quotation no": record.quotationNo || "NA",
        "Quotation date": record.quotationDate || "NA",
        "Invoice no": record.invoiceNo || "NA",
        "Invoice date": record.invoiceDate || "NA",
        "Invoice created": record.invoiceCreated ? "Yes" : "No",
        "Total value": totals.total,
        Paid: totals.paidAmount,
        Balance: totals.balanceDue,
        "Updated at": record.updatedAt || "",
        "Created at": record.createdAt || "",
        "Items count": record.items.length,
        "Discount %": record.discountPercent,
        "GST enabled": record.gstEnabled ? "Yes" : "No",
        "GST %": record.gstPercent,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 22 }, { wch: 16 }, { wch: 28 }, { wch: 18 }, { wch: 16 }, { wch: 18 },
      { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 12 },
      { wch: 12 }, { wch: 18 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 12 },
      { wch: 20 }, { wch: 20 }, { wch: 14 }, { wch: 14 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Approved jobs");
    XLSX.writeFile(workbook, `balaji-approved-jobs-${filtered.length}-records.xlsx`);
  };

  return (
    <div className="panel" aria-label="Approved customers and jobs">
      <div className="panel-head flex-wrap gap-2">
        <div>
          <h2>Approved customers &amp; jobs</h2>
          <p className="mt-1 text-xs font-normal normal-case tracking-normal text-muted">
            Only approved work appears here. New visits stay in the enquiry register until the customer approves the quotation.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            className="field-input !w-40 sm:!w-56 text-sm"
            placeholder="Search name, contact, quotation or invoice…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <input
            type="date"
            className="field-input !w-auto text-sm"
            aria-label="Filter jobs by date"
            title="Filter jobs by date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          <select className="field-input !w-auto text-sm" value={filter} onChange={(e) => setFilter(e.target.value as CustomerTableFilter)}>
            {FILTERS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-primary text-xs"
            onClick={exportExcel}
            disabled={filtered.length === 0}
          >
            Export Excel
          </button>
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
                    <div className="flex items-center gap-2">
                      <Link
                        href={r.invoiceCreated ? `/record/${r.id}/invoice` : `/record/${r.id}/quotation`}
                        className="action-view"
                      >
                        View
                      </Link>
                      <Link href={`/record/${r.id}/quotation`} className="action-update">
                        Update
                      </Link>
                      {(r.status === "enquiry" || r.status === "quotation_sent" || r.status === "request_closed") && (
                        <button
                          className="text-xs font-semibold text-red-700 hover:underline"
                          onClick={() =>
                            dispatch(
                              setStatus({
                                id: r.id,
                                status: r.status === "request_closed" ? (r.quotationPrinted ? "quotation_sent" : "enquiry") : "request_closed",
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
