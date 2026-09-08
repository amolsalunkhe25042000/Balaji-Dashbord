"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/hooks";
import { commitNextNumber, makeBlankRecord, upsertRecord } from "@/lib/recordsSlice";
import { SERVICES, GST_RATES } from "@/lib/services";
import { JobRecord, ServiceKey } from "@/lib/types";
import ServicePicker from "@/components/ServicePicker";
import ItemsEditor from "@/components/ItemsEditor";
import DocumentPreview from "@/components/DocumentPreview";

export default function NewJobPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [service, setService] = useState<ServiceKey>("waterproofing");
  const [draft, setDraft] = useState<JobRecord>(() => makeBlankRecord("waterproofing"));
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);

  const svc = SERVICES[service];

  const switchService = (next: ServiceKey) => {
    const hasData = draft.customer.name || draft.items.some((it) => it.description);
    if (hasData && !window.confirm(`Switch to ${SERVICES[next].label}? Unsaved details for this job will be cleared.`)) {
      return;
    }
    setService(next);
    setDraft(makeBlankRecord(next));
  };

  const patch = (p: Partial<JobRecord>) => setDraft((d) => ({ ...d, ...p }));

  const saveAndPrint = () => {
    setSaving(true);
    const quotationNo = dispatch(commitNextNumber(service, "quotation"));
    const finalRecord: JobRecord = {
      ...draft,
      quotationNo,
      quotationPrinted: true,
      status: "quotation_sent",
    };
    dispatch(upsertRecord(finalRecord));
    setDraft(finalRecord);
    setView("preview");
    setTimeout(() => {
      window.print();
      setTimeout(() => router.push(`/record/${finalRecord.id}/invoice`), 300);
    }, 80);
  };

  const saveEnquiry = () => {
    setSaving(true);
    dispatch(
      upsertRecord({
        ...draft,
        quotationNo: "",
        quotationPrinted: false,
        invoiceNo: "",
        invoiceCreated: false,
        status: "enquiry",
      })
    );
    router.push("/");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="no-print flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-display font-bold text-deep">New job</h1>
            <p className="text-sm text-muted">Save a customer enquiry first, or continue to the quotation stage when the customer accepts.</p>
        </div>
        <div className="bg-deep rounded-lg p-1">
          <ServicePicker value={service} onChange={switchService} />
        </div>
      </div>

      <div className="no-print flex gap-2 lg:hidden">
        <button
          className={`flex-1 py-2 rounded-md text-sm font-semibold border ${
            view === "edit" ? "bg-deep text-white border-deep" : "bg-white border-line text-muted"
          }`}
          onClick={() => setView("edit")}
        >
          Edit details
        </button>
        <button
          className={`flex-1 py-2 rounded-md text-sm font-semibold border ${
            view === "preview" ? "bg-deep text-white border-deep" : "bg-white border-line text-muted"
          }`}
          onClick={() => setView("preview")}
        >
          Preview
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5 items-start">
        {/* FORM */}
        <div className={`no-print flex flex-col gap-4 ${view === "edit" ? "" : "hidden"} lg:flex`}>
          <div className="panel">
            <div className="panel-head">
              <h2>Customer</h2>
            </div>
            <div className="panel-body">
              <div>
                <label className="field-label">Customer name</label>
                <input
                  className="field-input"
                  value={draft.customer.name}
                  placeholder="e.g. Mr. Suresh Patil"
                  onChange={(e) => patch({ customer: { ...draft.customer, name: e.target.value } })}
                />
              </div>
              <div>
                <label className="field-label">Site / billing address</label>
                <textarea
                  className="field-input min-h-[60px]"
                  value={draft.customer.address}
                  placeholder="Flat / plot no., building, area, city"
                  onChange={(e) => patch({ customer: { ...draft.customer, address: e.target.value } })}
                />
              </div>
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Contact number</label>
                  <input
                    className="field-input"
                    value={draft.customer.contact}
                    placeholder="98xxxxxxxx"
                    onChange={(e) => patch({ customer: { ...draft.customer, contact: e.target.value } })}
                  />
                </div>
                <div>
                  <label className="field-label">Site name (optional)</label>
                  <input
                    className="field-input"
                    value={draft.customer.site}
                    placeholder="e.g. Terrace, B-wing"
                    onChange={(e) => patch({ customer: { ...draft.customer, site: e.target.value } })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2>Quotation details</h2>
            </div>
            <div className="panel-body">
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Date</label>
                  <input
                    type="date"
                    className="field-input"
                    value={draft.quotationDate}
                    onChange={(e) => patch({ quotationDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">Valid for (days)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="field-input"
                    value={draft.validityDays}
                    onChange={(e) => patch({ validityDays: Number(e.target.value) })}
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                The quotation number is generated automatically the moment you click{" "}
                <b>&ldquo;Save &amp; print quotation&rdquo;</b> — format {svc.numberPrefix}Q + date + a daily count (e.g.{" "}
                {svc.numberPrefix}Q20260818<b>1</b>, then <b>2</b> for the next one printed the same day).
              </p>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2>Work items</h2>
            </div>
            <div className="panel-body">
              <ItemsEditor
                items={draft.items}
                presets={svc.presets}
                descPlaceholder={svc.descPlaceholder}
                onChange={(items) => patch({ items })}
              />
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2>Charges</h2>
            </div>
            <div className="panel-body">
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Discount (%)</label>
                  <input
                    type="number"
                    className="field-input"
                    value={draft.discountPercent}
                    onChange={(e) => patch({ discountPercent: Number(e.target.value) })}
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <div className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.gstEnabled}
                      onChange={(e) => patch({ gstEnabled: e.target.checked })}
                      id="gstchk"
                    />
                    <label htmlFor="gstchk">Add GST</label>
                    {draft.gstEnabled && (
                      <select
                        className="field-input !w-auto"
                        value={draft.gstPercent}
                        onChange={(e) => patch({ gstPercent: Number(e.target.value) })}
                      >
                        {GST_RATES.map((r) => (
                          <option key={r} value={r}>
                            {r}%
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2>Terms</h2>
            </div>
            <div className="panel-body">
              <div>
                <label className="field-label">Payment terms</label>
                <textarea
                  className="field-input min-h-[60px]"
                  value={draft.paymentTerms}
                  onChange={(e) => patch({ paymentTerms: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Warranty</label>
                <textarea
                  className="field-input min-h-[60px]"
                  value={draft.warranty}
                  onChange={(e) => patch({ warranty: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Terms and conditions (one per line)</label>
                <textarea
                  className="field-input min-h-[110px]"
                  value={draft.terms}
                  onChange={(e) => patch({ terms: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button className="btn-outline justify-center py-3 text-base" disabled={saving} onClick={saveEnquiry}>
              Save customer enquiry
            </button>
            <button className="btn-primary justify-center py-3 text-base" disabled={saving} onClick={saveAndPrint}>
              Save &amp; print quotation
            </button>
          </div>
        </div>

        {/* PREVIEW */}
        <div className={`${view === "preview" ? "" : "hidden"} lg:block`}>
          <DocumentPreview record={draft} mode="quotation" />
        </div>
      </div>
    </div>
  );
}
