import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DocumentEditor from "@/components/DocumentEditor";
import { sampleRecord } from "./fixtures";

afterEach(cleanup);

describe("DocumentEditor invoice validation", () => {
  it("rejects changes that reduce the invoice total below the amount already paid", () => {
    const onSave = vi.fn();
    const record = sampleRecord({
      items: [{ id: "item-1", description: "Painting", unit: "Sq.ft", qty: 1, rate: 100 }],
      payments: [{ id: "payment-1", amount: 80, mode: "Cash", date: "2026-01-01" }],
    });
    render(
      <DocumentEditor
        record={record}
        documentType="invoice"
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );

    const numberInputs = screen.getAllByRole("spinbutton");
    fireEvent.change(numberInputs[1], { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain(
      "The updated invoice total cannot be less than the ₹80 already paid.",
    );
  });
});
