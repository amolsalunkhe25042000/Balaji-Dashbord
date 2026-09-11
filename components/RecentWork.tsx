import Link from "next/link";
import { JobRecord } from "@/lib/types";
import { SERVICES } from "@/lib/services";
import { computeTotals, fmtMoney, formatDate } from "@/lib/money";
import { summarizeFinances } from "@/lib/financial";
import StatusBadge from "./StatusBadge";

export default function RecentWork({ records }: { records: JobRecord[] }) {
  const recent = [...records]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  return (
    <section className="panel overflow-hidden">
      <div className="panel-head"><div><h2>Recent jobs</h2><p className="mt-1 text-[11px] normal-case tracking-normal text-muted">The latest jobs and their current financial position.</p></div></div>
      {recent.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-xs"><thead><tr className="border-b border-line text-left uppercase tracking-wide text-muted"><th className="px-3 py-3">Customer / job</th><th className="px-3 py-3">Status</th><th className="px-3 py-3 text-right">Invoice</th><th className="px-3 py-3 text-right">Paid</th><th className="px-3 py-3 text-right">Outstanding</th><th className="px-3 py-3 text-right">Profit</th><th className="px-3 py-3 text-right">Updated</th></tr></thead><tbody>{recent.map((record) => { const totals = computeTotals(record); const profit = summarizeFinances([record]).grossProfit; const href = record.invoiceCreated ? `/record/${record.id}/invoice` : `/record/${record.id}/quotation`; return <tr key={record.id} className="border-b border-panel hover:bg-panel"><td className="px-3 py-3"><Link href={href} className="font-semibold text-deep hover:underline">{record.customer.name || "Unnamed customer"}</Link><span className="block text-[11px] text-muted">{SERVICES[record.service].label}</span></td><td className="px-3 py-3"><StatusBadge status={record.status} /></td><td className="px-3 py-3 text-right font-mono">{record.invoiceCreated ? `₹${fmtMoney(totals.total)}` : "—"}</td><td className="px-3 py-3 text-right font-mono text-water">{record.invoiceCreated ? `₹${fmtMoney(totals.paidAmount)}` : "—"}</td><td className="px-3 py-3 text-right font-mono text-paint">{record.invoiceCreated ? `₹${fmtMoney(totals.balanceDue)}` : "—"}</td><td className={`px-3 py-3 text-right font-mono ${profit >= 0 ? "text-emerald-700" : "text-red-700"}`}>{record.invoiceCreated ? `₹${fmtMoney(profit)}` : "—"}</td><td className="px-3 py-3 text-right text-muted">{formatDate(record.updatedAt.slice(0, 10))}</td></tr>; })}</tbody></table></div> : <div className="panel-body"><p className="text-sm text-muted">No jobs yet. Create your first enquiry or quotation to see it here.</p></div>}
    </section>
  );
}
