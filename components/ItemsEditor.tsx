"use client";

import { useState } from "react";
import { LineItem } from "@/lib/types";
import { PresetItem } from "@/lib/services";
import { UNITS } from "@/lib/services";
import { fmtMoney, lineItemTotal, newId } from "@/lib/money";

export default function ItemsEditor({
  items,
  presets,
  descPlaceholder,
  onChange,
}: {
  items: LineItem[];
  presets: PresetItem[];
  descPlaceholder: string;
  onChange: (items: LineItem[]) => void;
}) {
  const [presetOpen, setPresetOpen] = useState(false);

  const addItem = (preset?: PresetItem) => {
    onChange([
      ...items,
      { id: newId("item"), description: preset?.description || "", unit: preset?.unit || "Sq.ft", qty: "", rate: "" },
    ]);
    setPresetOpen(false);
  };

  const updateItem = (id: string, patch: Partial<LineItem>) => {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const removeItem = (id: string) => onChange(items.filter((it) => it.id !== id));

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <button
          type="button"
          className="w-full flex items-center justify-between border border-dashed border-water bg-water/10 text-water rounded-md px-3 py-2 text-sm font-semibold"
          onClick={() => setPresetOpen((o) => !o)}
        >
          <span>+ Add from common services</span>
          <span className="text-xs">▾</span>
        </button>
        {presetOpen && (
          <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-line rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {presets.map((p, i) => (
              <div
                key={i}
                className="px-3 py-2 text-sm cursor-pointer border-b border-panel last:border-b-0 hover:bg-panel"
                onClick={() => addItem(p)}
              >
                {p.description}
              </div>
            ))}
          </div>
        )}
      </div>

      {items.map((it, idx) => {
        const amount = lineItemTotal(it);
        return (
          <div key={it.id} className="border border-line rounded-lg p-3 flex flex-col gap-2 bg-[#FBFCFB]">
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <label className="field-label">Item {idx + 1} description</label>
                <input
                  className="field-input"
                  value={it.description}
                  placeholder={descPlaceholder}
                  onChange={(e) => updateItem(it.id, { description: e.target.value })}
                />
              </div>
              <button
                type="button"
                aria-label="Remove item"
                className="mt-6 text-red-600 hover:bg-red-50 rounded p-1.5"
                onClick={() => removeItem(it.id)}
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-2">
              <div>
                <label className="field-label">Unit</label>
                <select
                  className="field-input"
                  value={it.unit}
                  onChange={(e) => updateItem(it.id, { unit: e.target.value })}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Qty</label>
                <input
                  type="number"
                  min="0"
                  className="field-input"
                  value={it.qty}
                  placeholder="0"
                  onChange={(e) => updateItem(it.id, { qty: e.target.value === "" ? "" : Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="field-label">Rate (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="field-input"
                  value={it.rate}
                  placeholder="0"
                  onChange={(e) => updateItem(it.id, { rate: e.target.value === "" ? "" : Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="text-right text-xs text-muted">
              Amount: <span className="text-ink font-semibold">₹ {fmtMoney(amount)}</span>
            </div>
          </div>
        );
      })}

      <button type="button" className="btn-outline justify-center" onClick={() => addItem()}>
        + Add blank item
      </button>
    </div>
  );
}
