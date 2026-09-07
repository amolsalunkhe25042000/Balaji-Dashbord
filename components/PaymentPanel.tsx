"use client";

import { useState } from "react";
import { JobRecord, Payment } from "@/lib/types";
import { PAYMENT_MODES } from "@/lib/services";
import { fmtMoney, newId } from "@/lib/money";

export default function PaymentPanel({
  record,
  balanceDue,
  onAddPayment,
  onRemovePayment,
}: {
  record: JobRecord;
  balanceDue: number;
  onAddPayment: (payment: Payment) => void;
  onRemovePayment: (paymentId: string) => void;
}) {
  const [amount, setAmount] = useState<number | "">("");
  const [mode, setMode] = useState(PAYMENT_MODES[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const submit = () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    onAddPayment({ id: newId("pay"), amount: amt, mode, date });
    setAmount("");
  };

  const collectRemaining = () => {
    if (balanceDue <= 0) return;
    onAddPayment({ id: newId("pay"), amount: balanceDue, mode, date });
    setAmount("");
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Collect payment</h2>
      </div>
      <div className="panel-body">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Amount received (₹)</label>
            <input
              type="number"
              className="field-input"
              value={amount}
              placeholder="0"
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
          <div>
            <label className="field-label">Mode</label>
            <select className="field-input" value={mode} onChange={(e) => setMode(e.target.value)}>
              {PAYMENT_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="field-label">Date</label>
          <input type="date" className="field-input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <button type="button" className="btn-primary justify-center" onClick={submit}>
          + Add payment
        </button>
        {balanceDue > 0 && (
          <button
            type="button"
            className="btn-outline justify-center border-water text-water"
            onClick={collectRemaining}
          >
            Collect remaining balance (₹ {fmtMoney(balanceDue)})
          </button>
        )}

        {record.payments.length > 0 && (
          <div className="mt-2 border-t border-line pt-3">
            <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Payment history</div>
            <ul className="flex flex-col gap-1.5">
              {record.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm bg-panel rounded-md px-2.5 py-1.5">
                  <span>
                    ₹ {fmtMoney(p.amount)} · {p.mode} · {p.date}
                  </span>
                  <button
                    type="button"
                    className="text-red-600 text-xs font-semibold hover:underline"
                    onClick={() => onRemovePayment(p.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
