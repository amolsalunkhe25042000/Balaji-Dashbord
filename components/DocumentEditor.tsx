"use client";

import { useState } from "react";
import { GST_RATES, SERVICES } from "@/lib/services";
import { computeTotals, fmtMoney } from "@/lib/money";
import { JobRecord, LineItem } from "@/lib/types";
import ItemsEditor from "@/components/ItemsEditor";

type DiscountMode = "percent" | "amount";

export default function DocumentEditor({
  record,
  documentType,
  onSave,
  onCancel,
}: {
  record: JobRecord;
  documentType: "quotation" | "invoice";
  onSave: (patch: Partial<JobRecord>) => void;
  onCancel: () => void;
}) {
  const [items, setItems] = useState<LineItem[]>(record.items);
  const [discountMode, setDiscountMode] = useState<DiscountMode>(record.discountMode || "percent");
  const [discountValue, setDiscountValue] = useState(String(record.discountValue ?? record.discountPercent ?? 0));
  const [gstEnabled, setGstEnabled] = useState(record.gstEnabled);
  const [gstPercent, setGstPercent] = useState(record.gstPercent);
  const [error, setError] = useState("");
  const service = SERVICES[record.service];
  const numericDiscount = Number(discountValue);
  const discountPatch = {
    discountMode,
    discountValue: numericDiscount,
    discountPercent: discountMode === "percent" ? numericDiscount : 0,
  } as const;
  const candidate = { ...record, items, ...discountPatch, gstEnabled, gstPercent };
  const totals = computeTotals(candidate);

  function saveChanges() {
    if (!Number.isFinite(numericDiscount) || numericDiscount < 0 || (discountMode === "percent" && numericDiscount > 100)) {
      setError(discountMode === "percent" ? "Discount must be between 0% and 100%." : "Enter a valid discount amount.");
      return;
    }
    if (documentType === "invoice" && totals.total < totals.paidAmount) {
      setError(`The updated invoice total cannot be less than the ₹${fmtMoney(totals.paidAmount)} already paid.`);
      return;
    }
    setError("");
    onSave({ items, ...discountPatch, gstEnabled, gstPercent });
  }

  return (
    <section className="no-print panel p-4" aria-label={`Edit ${documentType}`}>
      <div className="mb-4">
        <h2 className="font-display text-xl font-bold text-deep">Edit {documentType}</h2>
        <p className="mt-1 text-sm text-muted">Update work items, discount, or GST. The document number stays the same.</p>
      </div>
      <div className="flex flex-col gap-5">
        <div>
          <h3 className="mb-2 text-sm font-bold text-deep">Work items</h3>
          <ItemsEditor
            items={items}
            presets={service.presets}
            descPlaceholder={service.descPlaceholder}
            onChange={setItems}
          />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-bold text-deep">Discount and tax</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="field-label" htmlFor={`${documentType}-discount-mode`}>Discount type</label>
              <select
                id={`${documentType}-discount-mode`}
                className="field-input"
                value={discountMode}
                onChange={(event) => setDiscountMode(event.target.value as DiscountMode)}
              >
                <option value="percent">Percentage</option>
                <option value="amount">Fixed amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor={`${documentType}-discount-value`}>
                Discount {discountMode === "percent" ? "(%)" : "(₹)"}
              </label>
              <input
                id={`${documentType}-discount-value`}
                className="field-input"
                type="number"
                min="0"
                max={discountMode === "percent" ? 100 : undefined}
                step="0.01"
                value={discountValue}
                onChange={(event) => setDiscountValue(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id={`${documentType}-gst-enabled`}
                type="checkbox"
                className="h-4 w-4 accent-[#0F8B8D]"
                checked={gstEnabled}
                onChange={(event) => setGstEnabled(event.target.checked)}
              />
              <label htmlFor={`${documentType}-gst-enabled`} className="text-sm font-medium text-deep">Add GST</label>
              {gstEnabled && (
                <select
                  className="field-input !w-auto"
                  aria-label="GST rate"
                  value={gstPercent}
                  onChange={(event) => setGstPercent(Number(event.target.value))}
                >
                  {GST_RATES.map((rate) => <option key={rate} value={rate}>{rate}%</option>)}
                </select>
              )}
            </div>
          </div>
          <p className="mt-3 text-sm text-muted">
            Updated total: <span className="font-bold text-deep">₹{fmtMoney(totals.total)}</span>
            {documentType === "invoice" && <> · Paid: ₹{fmtMoney(totals.paidAmount)} · Balance: ₹{fmtMoney(totals.balanceDue)}</>}
          </p>
        </div>
        {error && <p className="text-sm font-semibold text-red-700" role="alert">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
          <button type="button" className="btn-outline" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn-primary" onClick={saveChanges}>Save changes</button>
        </div>
      </div>
    </section>
  );
}
