import { JobRecord } from "@/lib/types";
import { SERVICES } from "@/lib/services";
import { computeTotals, fmtMoney, formatDate, numberToWordsIndian } from "@/lib/money";

function Wave({ color, height = 10 }: { color: string; height?: number }) {
  return (
    <svg viewBox="0 0 400 20" preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
      <path
        d="M0 10 C 25 0, 75 20, 100 10 C 125 0, 175 20, 200 10 C 225 0, 275 20, 300 10 C 325 0, 375 20, 400 10 L 400 20 L 0 20 Z"
        fill={color}
      />
    </svg>
  );
}

function ServiceMark({ variant, accent, size = 46 }: { variant: "drop" | "roller"; accent: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 4 L58 14 V30 C58 46 47 57 32 61 C17 57 6 46 6 30 V14 Z" fill="#0B3142" />
      <path d="M32 8 L54 17 V30 C54 44 45 53.5 32 57 C19 53.5 10 44 10 30 V17 Z" fill={accent} />
      {variant === "drop" ? (
        <path
          d="M32 16 C26 25 21 31.5 21 37.5 C21 44 25.9 48.5 32 48.5 C38.1 48.5 43 44 43 37.5 C43 31.5 38 25 32 16 Z"
          fill="#F6F4EF"
        />
      ) : (
        <g>
          <rect x="18" y="19" width="28" height="13" rx="6" fill="#F6F4EF" />
          <rect x="29" y="30" width="6" height="17" rx="3" fill="#F6F4EF" />
          <circle cx="24" cy="41" r="2.2" fill="#F6F4EF" opacity="0.85" />
          <circle cx="40" cy="44" r="1.8" fill="#F6F4EF" opacity="0.7" />
        </g>
      )}
      <path d="M15 40 C22 38.5 42 38.5 49 40 L49 42 C42 40.7 22 40.7 15 42 Z" fill="#0B3142" opacity="0.85" />
    </svg>
  );
}

export default function DocumentPreview({
  record,
  mode,
}: {
  record: JobRecord;
  mode: "quotation" | "invoice";
}) {
  const svc = SERVICES[record.service];
  const isInvoice = mode === "invoice";
  const totals = computeTotals(record);
  const docLabel = isInvoice ? "Invoice" : "Quotation";
  const docNo = isInvoice ? record.invoiceNo : record.quotationNo;
  const docDate = isInvoice ? record.invoiceDate : record.quotationDate;

  const paymentStatus =
    totals.paidAmount <= 0 ? "UNPAID" : totals.balanceDue <= 0 ? "PAID" : "PARTIALLY PAID";
  const statusColor =
    paymentStatus === "PAID" ? "#1D8A4A" : paymentStatus === "PARTIALLY PAID" ? "#C97A1E" : "#B44848";

  return (
    <div className="bg-paper border border-line rounded-xl overflow-hidden relative" id="doc-preview">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
      >
        <div className="flex -rotate-[28deg] flex-col items-center gap-3 text-center" style={{ opacity: 0.07 }}>
          <ServiceMark variant={svc.logo as "drop" | "roller"} accent={svc.accentHex} size={190} />
          <div className="font-display text-4xl font-bold tracking-wide text-deep">{record.company.name}</div>
          <div className="text-sm font-semibold uppercase tracking-[0.3em] text-deep">{svc.label}</div>
        </div>
      </div>

      <div className="relative z-[1]">
      {isInvoice && paymentStatus === "PAID" && (
        <div
          className="absolute z-10 border-[3px] rounded-lg font-extrabold uppercase tracking-widest px-4 py-1.5"
          style={{
            top: 130,
            right: 40,
            borderColor: "#1D8A4A",
            color: "#1D8A4A",
            transform: "rotate(-12deg)",
            opacity: 0.85,
            fontSize: 22,
          }}
        >
          PAID
        </div>
      )}

      <div className="bg-deep text-white px-6 sm:px-8 pt-6">
        <div className="flex items-center gap-4 pb-5">
          <ServiceMark variant={svc.logo as "drop" | "roller"} accent={svc.accentHex} size={46} />
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-bold">{record.company.name}</h2>
            <div className="text-xs text-[#9FD3D2]">{record.company.tagline}</div>
          </div>
        </div>
        <Wave color={svc.accentHex} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 sm:px-8 py-5 bg-white border-b border-line text-sm">
        <div>
          <p className="text-xs text-muted mb-0.5">Company address</p>
          <div className="text-[13px]">{record.company.address}</div>
          <p className="text-xs text-muted mt-2 mb-0.5">Contact</p>
          <div className="text-[13px]">
            {record.company.phone1}
            {record.company.phone2 ? ` / ${record.company.phone2}` : ""} · {record.company.website}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <p className="text-xs text-muted mb-0.5">{isInvoice ? "Bill to" : "Quotation to"}</p>
            <div className="text-[13.5px] font-semibold">
              {record.customer.name || <span className="italic text-gray-400 font-normal">Customer name</span>}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted mb-0.5">Contact no.</p>
            <div className="text-[13.5px] font-semibold">{record.customer.contact || "—"}</div>
          </div>
          <div>
            <p className="text-xs text-muted mb-0.5">{docLabel} no.</p>
            <div className="text-[13.5px] font-semibold font-mono">{docNo || "—"}</div>
          </div>
          <div>
            <p className="text-xs text-muted mb-0.5">Date</p>
            <div className="text-[13.5px] font-semibold font-mono">{formatDate(docDate)}</div>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-muted mb-0.5">Site address</p>
            <div className="text-[13px]">
              {record.customer.address || <span className="italic text-gray-400">Site / billing address</span>}
              {record.customer.site ? ` — ${record.customer.site}` : ""}
            </div>
          </div>
          {isInvoice && (
            <div className="col-span-2">
              <p className="text-xs text-muted mb-0.5">Reference</p>
              <div className="text-[13px] font-mono">Quotation No. {record.quotationNo || "—"}</div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-6 sm:px-8 pt-4">
        <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: svc.accentHex }}>
          {isInvoice ? "Tax invoice" : svc.scopeLabel}
        </span>
        {isInvoice ? (
          <span className="badge" style={{ backgroundColor: statusColor }}>
            {paymentStatus}
          </span>
        ) : (
          <span className="text-sm">Valid for {record.validityDays || 0} days</span>
        )}
      </div>

      <div className="px-6 sm:px-8 pt-4 overflow-x-auto">
        <table className="w-full border-collapse text-[13px] min-w-[520px]">
          <thead>
            <tr className="bg-deep text-white">
              <th className="text-left px-2.5 py-2 text-[11px] uppercase tracking-wide w-9">Sr</th>
              <th className="text-left px-2.5 py-2 text-[11px] uppercase tracking-wide">Description</th>
              <th className="text-left px-2.5 py-2 text-[11px] uppercase tracking-wide">Unit</th>
              <th className="text-right px-2.5 py-2 text-[11px] uppercase tracking-wide">Qty</th>
              <th className="text-right px-2.5 py-2 text-[11px] uppercase tracking-wide">Rate (₹)</th>
              <th className="text-right px-2.5 py-2 text-[11px] uppercase tracking-wide">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {record.items.map((it, idx) => {
              const amount = (Number(it.qty) || 0) * (Number(it.rate) || 0);
              return (
                <tr key={it.id} className={idx % 2 === 1 ? "bg-[#FBFCFB]" : ""}>
                  <td className="px-2.5 py-2 border-b border-line align-top">{idx + 1}</td>
                  <td className="px-2.5 py-2 border-b border-line align-top">
                    {it.description || <span className="italic text-gray-400">Item description</span>}
                  </td>
                  <td className="px-2.5 py-2 border-b border-line align-top">{it.unit}</td>
                  <td className="px-2.5 py-2 border-b border-line align-top text-right">{it.qty || "—"}</td>
                  <td className="px-2.5 py-2 border-b border-line align-top text-right font-mono">
                    {it.rate !== "" ? fmtMoney(Number(it.rate)) : "—"}
                  </td>
                  <td className="px-2.5 py-2 border-b border-line align-top text-right font-mono">{fmtMoney(amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-6 sm:px-8 pt-4 flex justify-end">
        <table className="text-[13px] min-w-[260px]">
          <tbody>
            <tr>
              <td className="py-1.5 text-muted">Subtotal</td>
              <td className="py-1.5 text-right font-semibold font-mono">₹ {fmtMoney(totals.subtotal)}</td>
            </tr>
            {totals.discountAmount > 0 && (
              <tr>
                <td className="py-1.5 text-muted">Discount ({record.discountPercent}%)</td>
                <td className="py-1.5 text-right font-semibold font-mono">− ₹ {fmtMoney(totals.discountAmount)}</td>
              </tr>
            )}
            {record.gstEnabled && (
              <tr>
                <td className="py-1.5 text-muted">GST ({record.gstPercent}%)</td>
                <td className="py-1.5 text-right font-semibold font-mono">+ ₹ {fmtMoney(totals.gstAmount)}</td>
              </tr>
            )}
            <tr>
              <td className="pt-2.5 border-t-2 border-deep text-base font-bold text-deep">Total</td>
              <td className="pt-2.5 border-t-2 border-deep text-base font-bold text-deep text-right font-mono">
                ₹ {fmtMoney(totals.total)}/-
              </td>
            </tr>
            {isInvoice && (
              <>
                <tr>
                  <td className="py-1.5 text-muted">Amount paid</td>
                  <td className="py-1.5 text-right font-semibold font-mono">− ₹ {fmtMoney(totals.paidAmount)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-bold">Balance due</td>
                  <td
                    className="py-1.5 text-right font-bold font-mono"
                    style={{ color: totals.balanceDue > 0 ? "#B44848" : "#1D8A4A" }}
                  >
                    ₹ {fmtMoney(totals.balanceDue)}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className="mx-6 sm:mx-8 mt-4 px-3.5 py-2.5 bg-water/10 border border-water/30 rounded-md text-[12.5px]">
        <b className="text-deep">In words:</b> Rupees {numberToWordsIndian(totals.total)} Only.
        {isInvoice && totals.balanceDue > 0 && (
          <>
            {" "}
            &nbsp;·&nbsp; <b className="text-deep">Balance due:</b> Rupees {numberToWordsIndian(totals.balanceDue)} Only.
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 px-6 sm:px-8 pt-5 text-xs">
        <div>
          <h3 className="text-[11px] uppercase tracking-wide text-muted font-semibold mb-1.5">
            {isInvoice ? "Payment received" : "Payment terms"}
          </h3>
          {isInvoice ? (
            <p className="leading-relaxed">
              {record.payments.length === 0
                ? "No payment recorded yet."
                : record.payments
                    .map((p) => `₹ ${fmtMoney(p.amount)} via ${p.mode} on ${formatDate(p.date)}`)
                    .join("; ") + "."}{" "}
              {totals.balanceDue > 0 ? `Balance of ₹ ${fmtMoney(totals.balanceDue)} pending.` : "Payment complete."}
            </p>
          ) : (
            <p className="leading-relaxed">{record.paymentTerms}</p>
          )}
          <h3 className="text-[11px] uppercase tracking-wide text-muted font-semibold mb-1.5 mt-2.5">Warranty</h3>
          <p className="leading-relaxed">{record.warranty}</p>
        </div>
        <div>
          <h3 className="text-[11px] uppercase tracking-wide text-muted font-semibold mb-1.5">Terms and conditions</h3>
          <ul className="list-disc pl-4 leading-relaxed">
            {record.terms
              .split("\n")
              .filter(Boolean)
              .map((t, i) => (
                <li key={i} className="mb-1">
                  {t}
                </li>
              ))}
          </ul>
        </div>
      </div>

      <div className="mt-5">
        <Wave color="#EEF2F0" />
      </div>

      <div className="px-6 sm:px-8 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="text-[11.5px] text-muted leading-relaxed">
          {record.company.email}
          {record.company.gstin ? ` · GSTIN: ${record.company.gstin}` : ""}
          <br />
          This is a computer generated {docLabel.toLowerCase()}.
        </div>
        <div className="text-xs text-muted text-center">
          <div className="w-[150px] border-t border-ink mb-1.5" />
          For {record.company.name}
        </div>
      </div>
      </div>
    </div>
  );
}
