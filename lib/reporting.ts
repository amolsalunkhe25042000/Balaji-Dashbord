import { BusinessExpense, Expense, JobRecord } from "./types";
import { computeTotals, isInvoiceRecord } from "./money";
import { FinancialSummary, summarizeFinances } from "./financial";

export type ReportRange = "all" | "today" | "week" | "month" | "year" | "custom";

export interface DateRange {
  start: string;
  end: string;
}

export interface RevenueRow {
  record: JobRecord;
  invoiceAmount: number;
  paidAmount: number;
  outstandingAmount: number;
}

export interface ExpenseRow {
  type: "Job Expense" | "Business Expense";
  date: string;
  category: string;
  jobLabel: string;
  description: string;
  vendor: string;
  paymentMethod: string;
  amount: number;
  record?: JobRecord;
  expense: Expense | BusinessExpense;
}

export interface JobProfitabilityRow {
  record: JobRecord;
  revenue: number;
  jobExpenses: number;
  grossProfit: number;
  profitMargin: number;
  paidAmount: number;
  outstandingAmount: number;
}

function localDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  return result;
}

export function resolveDateRange(range: ReportRange, customStart: string, customEnd: string, now = new Date()): DateRange | null {
  if (range === "all") return null;
  if (range === "custom") return { start: customStart, end: customEnd || customStart };
  const end = new Date(now);
  const start = new Date(now);
  if (range === "week") start.setTime(startOfWeek(now).getTime());
  if (range === "month") start.setDate(1);
  if (range === "year") { start.setMonth(0); start.setDate(1); }
  return { start: localDate(start), end: localDate(end) };
}

export function dateInRange(date: string, dateRange: DateRange | null): boolean {
  if (!dateRange) return true;
  return Boolean(date) && date >= dateRange.start && date <= dateRange.end;
}

export function filterRecordsByDate(records: JobRecord[], dateRange: DateRange | null): JobRecord[] {
  if (!dateRange) return records;
  return records.filter((record) => dateInRange(record.invoiceDate, dateRange) || dateInRange(record.updatedAt.slice(0, 10), dateRange));
}

export function reportFinancialSummary(records: JobRecord[], businessExpenses: BusinessExpense[], dateRange: DateRange | null): FinancialSummary {
  const filteredRecords = dateRange ? records.filter((record) => dateInRange(record.invoiceDate, dateRange) || (record.expenses || []).some((expense) => dateInRange(expense.date, dateRange))) : records;
  const filteredBusinessExpenses = businessExpenses.filter((expense) => dateInRange(expense.date, dateRange));
  const recordsWithExpenses = filteredRecords.map((record) => ({
    ...record,
    expenses: (record.expenses || []).filter((expense) => dateInRange(expense.date, dateRange)),
  }));
  return summarizeFinances(recordsWithExpenses, filteredBusinessExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0));
}

export function revenueRows(records: JobRecord[], dateRange: DateRange | null): RevenueRow[] {
  return records.filter((record) => isInvoiceRecord(record) && dateInRange(record.invoiceDate, dateRange)).map((record) => {
    const totals = computeTotals(record);
    return { record, invoiceAmount: totals.total, paidAmount: totals.paidAmount, outstandingAmount: totals.balanceDue };
  });
}

export function expenseRows(records: JobRecord[], businessExpenses: BusinessExpense[], dateRange: DateRange | null): ExpenseRow[] {
  const jobRows = records.flatMap((record) => (record.expenses || []).filter((expense) => dateInRange(expense.date, dateRange)).map((expense) => ({
    type: "Job Expense" as const,
    date: expense.date,
    category: expense.category,
    jobLabel: record.customer.name || record.id,
    description: expense.description,
    vendor: expense.vendor || "",
    paymentMethod: expense.paymentMethod || "",
    amount: Number(expense.amount) || 0,
    record,
    expense,
  })));
  const businessRows = businessExpenses.filter((expense) => dateInRange(expense.date, dateRange)).map((expense) => ({
    type: "Business Expense" as const,
    date: expense.date,
    category: expense.category,
    jobLabel: "Business",
    description: expense.description,
    vendor: expense.vendor || "",
    paymentMethod: expense.paymentMethod || "",
    amount: Number(expense.amount) || 0,
    expense,
  }));
  return [...jobRows, ...businessRows].sort((a, b) => b.date.localeCompare(a.date));
}

export function jobProfitabilityRows(records: JobRecord[], dateRange: DateRange | null): JobProfitabilityRow[] {
  return records.map((record) => {
    const totals = computeTotals(record);
    const expenses = (record.expenses || []).filter((expense) => dateInRange(expense.date, dateRange)).reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
    const revenue = isInvoiceRecord(record) && (!dateRange || dateInRange(record.invoiceDate, dateRange)) ? totals.total : 0;
    const grossProfit = revenue - expenses;
    return { record, revenue, jobExpenses: expenses, grossProfit, profitMargin: revenue ? (grossProfit / revenue) * 100 : 0, paidAmount: revenue ? totals.paidAmount : 0, outstandingAmount: revenue ? totals.balanceDue : 0 };
  });
}

export function monthKey(date: string): string {
  return date ? date.slice(0, 7) : "";
}

export function monthlyReportRows(records: JobRecord[], businessExpenses: BusinessExpense[], dateRange: DateRange | null) {
  const months = new Set<string>();
  revenueRows(records, dateRange).forEach(({ record }) => months.add(monthKey(record.invoiceDate)));
  expenseRows(records, businessExpenses, dateRange).forEach((row) => months.add(monthKey(row.date)));
  return Array.from(months).filter(Boolean).sort().map((month) => {
    const monthRecords = records
      .filter((record) => monthKey(record.invoiceDate) === month || (record.expenses || []).some((expense) => monthKey(expense.date) === month))
      .map((record) => ({ ...record, expenses: (record.expenses || []).filter((expense) => monthKey(expense.date) === month) }));
    const monthBusinessExpenses = businessExpenses.filter((expense) => monthKey(expense.date) === month);
    const summary = reportFinancialSummary(monthRecords, monthBusinessExpenses, null);
    const paid = revenueRows(monthRecords, null).reduce((sum, row) => sum + row.paidAmount, 0);
    return { month, ...summary, paid };
  });
}
