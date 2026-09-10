import { JobStatus } from "@/lib/types";

const STATUS_META: Record<JobStatus, { label: string; className: string }> = {
  enquiry: { label: "Enquiry", className: "bg-slate-400" },
  quotation_sent: { label: "Quotation sent", className: "bg-blue-500" },
  approved: { label: "Approved", className: "bg-cyan-600" },
  invoiced: { label: "Pending", className: "bg-amber-500" },
  partially_paid: { label: "Partially paid", className: "bg-orange-500" },
  paid: { label: "Paid", className: "bg-emerald-600" },
  closed: { label: "Closed / Complete", className: "bg-slate-700" },
  request_closed: { label: "Request closed", className: "bg-red-700" },
};

export default function StatusBadge({ status }: { status: JobStatus }) {
  const meta = STATUS_META[status];
  return <span className={`badge ${meta.className}`}>{meta.label}</span>;
}

export { STATUS_META };
