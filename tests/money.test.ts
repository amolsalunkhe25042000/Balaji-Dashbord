import { describe, expect, it } from "vitest";
import { computeTotals } from "@/lib/money";
import { sampleRecord } from "./fixtures";

describe("computeTotals discounts", () => {
  it("preserves percentage discount behavior for legacy records", () => {
    const totals = computeTotals(sampleRecord({ discountPercent: 10 }));

    expect(totals.discountAmount).toBe(20);
    expect(totals.gstAmount).toBeCloseTo(32.4);
    expect(totals.total).toBe(212);
  });

  it("applies a fixed amount discount below the subtotal before GST", () => {
    const totals = computeTotals(sampleRecord({
      discountMode: "amount",
      discountValue: 50,
    }));

    expect(totals.discountAmount).toBe(50);
    expect(totals.gstAmount).toBe(27);
    expect(totals.total).toBe(177);
  });

  it("caps a fixed amount discount at the subtotal", () => {
    const totals = computeTotals(sampleRecord({
      discountMode: "amount",
      discountValue: 250,
    }));

    expect(totals.discountAmount).toBe(200);
    expect(totals.gstAmount).toBe(0);
    expect(totals.total).toBe(0);
  });

  it("clamps percentage discounts above 100 percent", () => {
    const totals = computeTotals(sampleRecord({ discountPercent: 125 }));

    expect(totals.discountAmount).toBe(200);
    expect(totals.gstAmount).toBe(0);
    expect(totals.total).toBe(0);
  });
});
