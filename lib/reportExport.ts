import * as XLSX from "xlsx";
import { FinancialSummary } from "./financial";
import { ExpenseRow, JobProfitabilityRow, RevenueRow } from "./reporting";
import { JobRecord } from "./types";
import { computeTotals } from "./money";

function money(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function setColumnWidths(sheet: XLSX.WorkSheet, widths: number[]) {
  sheet["!cols"] = widths.map((wch) => ({ wch }));
  sheet["!autofilter"] = { ref: sheet["!ref"] || "A1:A1" };
  const range = sheet["!ref"] ? XLSX.utils.decode_range(sheet["!ref"]) : null;
  if (!range) return;
  const headers = Array.from({ length: range.e.c + 1 }, (_, column) => String(sheet[XLSX.utils.encode_cell({ r: 0, c: column })]?.v || "").toLowerCase());
  for (let row = 1; row <= range.e.r; row += 1) {
    headers.forEach((header, column) => {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })];
      if (!cell || typeof cell.v !== "number") return;
      if (header.includes("margin")) cell.z = "0.0%";
      else if (["amount", "revenue", "paid", "outstanding", "expenses", "profit", "invoiced"].some((word) => header.includes(word))) cell.z = '"₹"#,##0';
    });
  }
}

function addSheet(workbook: XLSX.WorkBook, name: string, rows: unknown[][], widths: number[]) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  setColumnWidths(sheet, widths);
  XLSX.utils.book_append_sheet(workbook, sheet, name);
}

export function downloadReportWorkbook({ summary, records, revenue, expenses, profitability }: { summary: FinancialSummary; records: JobRecord[]; revenue: RevenueRow[]; expenses: ExpenseRow[]; profitability: JobProfitabilityRow[] }) {
  const workbook = XLSX.utils.book_new();
  addSheet(workbook, "Financial Summary", [
    ["Metric", "Amount"],
    ["Revenue / Invoiced", money(summary.revenue)],
    ["Paid", money(summary.paidAmount)],
    ["Outstanding", money(summary.outstandingAmount)],
    ["Job Expenses", money(summary.jobExpenses)],
    ["Business Expenses", money(summary.businessExpenses)],
    ["Gross Profit", money(summary.grossProfit)],
    ["Net Profit", money(summary.netProfit)],
    ["Profit Margin", money(summary.profitMargin) / 100],
  ], [28, 18]);
  addSheet(workbook, "Jobs", [["Job ID", "Customer", "Service", "Status", "Created", "Updated"], ...records.map((record) => [record.id, record.customer.name, record.service, record.status, record.createdAt, record.updatedAt])], [20, 28, 18, 18, 24, 24]);
  addSheet(workbook, "Quotations", [["Quotation No", "Job ID", "Customer", "Date", "Amount", "Status"], ...records.filter((record) => record.quotationPrinted).map((record) => [record.quotationNo, record.id, record.customer.name, record.quotationDate, money(computeTotals(record).total), record.status])], [20, 20, 28, 14, 18, 18]);
  addSheet(workbook, "Invoices", [["Invoice No", "Job ID", "Customer", "Date", "Amount", "Paid", "Outstanding", "Status"], ...revenue.map((row) => [row.record.invoiceNo, row.record.id, row.record.customer.name, row.record.invoiceDate, money(row.invoiceAmount), money(row.paidAmount), money(row.outstandingAmount), row.record.status])], [20, 20, 28, 14, 18, 18, 18, 18]);
  addSheet(workbook, "Payments", [["Payment ID", "Invoice", "Job ID", "Customer", "Date", "Amount", "Method", "Notes"], ...revenue.flatMap((row) => row.record.payments.map((payment) => [payment.id, row.record.invoiceNo, row.record.id, row.record.customer.name, payment.date, money(payment.amount), payment.mode, payment.note || ""]))], [20, 20, 20, 28, 14, 18, 18, 30]);
  addSheet(workbook, "Expenses", [["Expense ID", "Type", "Job ID", "Customer / Business", "Date", "Category", "Description", "Vendor", "Payment Method", "Amount", "Notes"], ...expenses.map((row) => [row.expense.id, row.type, row.record?.id || "", row.jobLabel, row.date, row.category, row.description, row.vendor, row.paymentMethod, money(row.amount), "notes" in row.expense ? row.expense.notes || "" : ""])], [22, 18, 20, 28, 14, 18, 34, 24, 20, 18, 30]);
  addSheet(workbook, "Job Profitability", [["Job ID", "Customer", "Revenue", "Job Expenses", "Gross Profit", "Profit Margin", "Paid", "Outstanding", "Status"], ...profitability.map((row) => [row.record.id, row.record.customer.name, money(row.revenue), money(row.jobExpenses), money(row.grossProfit), money(row.profitMargin) / 100, money(row.paidAmount), money(row.outstandingAmount), row.record.status])], [20, 28, 18, 18, 18, 18, 18, 18, 18]);
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `Balaji_CRM_Report_${date}.xlsx`);
}
