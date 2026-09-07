import Link from "next/link";
import { JobRecord } from "@/lib/types";
import { SERVICES } from "@/lib/services";
import { computeTotals, fmtMoney, formatDate } from "@/lib/money";
import StatusBadge from "./StatusBadge";

export default function RecentWork({ records }: { records: JobRecord[] }) {
  const recent = [...records]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  if (recent.length === 0) {
    return (
      <div className="panel">
        <div className="panel-head">
          <h2>Recent work</h2>
        </div>
        <div className="panel-body">
          <p className="text-sm text-muted">No jobs yet. Create your first enquiry or quotation to see it here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Recent work</h2>
      </div>
      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {recent.map((r) => {
          const svc = SERVICES[r.service];
          const totals = computeTotals(r);
          const href = r.invoiceCreated ? `/record/${r.id}/invoice` : `/record/${r.id}/quotation`;
          return (
            <Link
              key={r.id}
              href={href}
              className="rounded-lg border border-line p-3 flex flex-col gap-1.5 hover:shadow-md transition bg-white"
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: `${svc.accentHex}22`, color: svc.accentHex }}
                >
                  {svc.label}
                </span>
                <StatusBadge status={r.status} />
              </div>
              <div className="font-semibold text-sm truncate">{r.customer.name || "Unnamed customer"}</div>
              <div className="text-xs text-muted">{formatDate(r.updatedAt.slice(0, 10))}</div>
              <div className="text-sm font-mono font-semibold text-deep">₹ {fmtMoney(totals.total)}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
