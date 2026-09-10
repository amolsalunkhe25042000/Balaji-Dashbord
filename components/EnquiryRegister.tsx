import Link from "next/link";
import { JobRecord } from "@/lib/types";
import { SERVICES } from "@/lib/services";
import { computeTotals, fmtMoney, formatDate } from "@/lib/money";
import StatusBadge from "./StatusBadge";

export default function EnquiryRegister({ records }: { records: JobRecord[] }) {
  const enquiries = [...records].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <section className="panel" aria-label="Customer visits and approval queue">
      <div className="panel-head flex-wrap gap-2">
        <div>
          <h2>Customer visits &amp; approval queue</h2>
          <p className="mt-1 text-xs font-normal normal-case tracking-normal text-muted">
            New visits, quotations waiting for approval, and rejected requests stay out of the approved work pipeline.
          </p>
        </div>
        <span className="rounded-full bg-water/10 px-2.5 py-1 text-xs font-bold text-water">
          {enquiries.length} enquiries
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5">Customer request</th>
              <th className="px-4 py-2.5">Service</th>
              <th className="px-4 py-2.5">Contact / site</th>
              <th className="px-4 py-2.5 text-right">Estimated value</th>
              <th className="px-4 py-2.5">Received</th>
              <th className="px-4 py-2.5">Action</th>
            </tr>
          </thead>
          <tbody>
            {enquiries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted">
                  No customer enquiries saved yet.
                </td>
              </tr>
            )}
            {enquiries.map((record) => {
              const service = SERVICES[record.service];
              const totals = computeTotals(record);
              return (
                <tr key={record.id} className="border-b border-panel hover:bg-panel/60">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-deep">{record.customer.name || "Unnamed customer"}</div>
                    <div className="max-w-[260px] truncate text-xs text-muted">
                      {record.customer.address || record.customer.site || "No site details"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold" style={{ color: service.accentHex }}>
                      {service.label}
                    </div>
                    <div className="mt-1">
                      <StatusBadge status={record.status} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    <div>{record.customer.contact || "No contact"}</div>
                    <div>{record.customer.site || "No site name"}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">₹ {fmtMoney(totals.total)}</td>
                  <td className="px-4 py-3 text-xs text-muted">{formatDate(record.createdAt.slice(0, 10))}</td>
                  <td className="px-4 py-3">
                    <Link href={`/record/${record.id}/quotation`} className="text-xs font-semibold text-water hover:underline">
                      {record.status === "enquiry" ? "Send quotation" : record.status === "request_closed" ? "Review request" : "View quotation"}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
