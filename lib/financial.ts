import { createSelector } from "@reduxjs/toolkit";
import { JobRecord } from "./types";
import { computeTotals, isInvoiceRecord } from "./money";
import { selectAllRecords } from "./recordsSlice";
import type { RootState } from "./store";

export interface FinancialSummary {
  revenue: number;
  paidAmount: number;
  outstandingAmount: number;
  jobExpenses: number;
  businessExpenses: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
}

export interface MonthlyFinancialSummary extends FinancialSummary {
  month: string;
}

function amount(value: unknown): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

export function invoiceRevenue(records: JobRecord[]): number {
  return records.reduce((sum, record) => sum + (isInvoiceRecord(record) ? computeTotals(record).total : 0), 0);
}

export function paidAmount(records: JobRecord[]): number {
  return records.reduce((sum, record) => sum + (isInvoiceRecord(record) ? computeTotals(record).paidAmount : 0), 0);
}

export function outstandingAmount(records: JobRecord[]): number {
  return records.reduce((sum, record) => sum + (isInvoiceRecord(record) ? computeTotals(record).balanceDue : 0), 0);
}

export function jobExpenseTotal(records: JobRecord[]): number {
  return records.reduce(
    (sum, record) => sum + (record.expenses || []).reduce((expenseSum, expense) => expenseSum + amount(expense.amount), 0),
    0,
  );
}

export function businessExpenseTotal(state: RootState): number {
  return (state.records.businessExpenses || []).reduce((sum, expense) => sum + amount(expense.amount), 0);
}

export function summarizeFinances(records: JobRecord[], businessExpensesTotal = 0): FinancialSummary {
  const revenue = invoiceRevenue(records);
  const paid = paidAmount(records);
  const outstanding = outstandingAmount(records);
  const jobExpenses = jobExpenseTotal(records);
  const grossProfit = revenue - jobExpenses;
  const safeBusinessExpenses = amount(businessExpensesTotal);
  const netProfit = grossProfit - safeBusinessExpenses;
  const profitMargin = revenue === 0 ? 0 : (grossProfit / revenue) * 100;

  return {
    revenue,
    paidAmount: paid,
    outstandingAmount: outstanding,
    jobExpenses,
    businessExpenses: safeBusinessExpenses,
    grossProfit,
    netProfit,
    profitMargin: Number.isFinite(profitMargin) ? profitMargin : 0,
  };
}

export function monthlyFinancialSummaries(records: JobRecord[], businessExpenses: RootState["records"]["businessExpenses"]): MonthlyFinancialSummary[] {
  const months = new Set<string>();
  records.forEach((record) => {
    if (isInvoiceRecord(record) && record.invoiceDate) months.add(record.invoiceDate.slice(0, 7));
    (record.expenses || []).forEach((expense) => expense.date && months.add(expense.date.slice(0, 7)));
  });
  businessExpenses.forEach((expense) => expense.date && months.add(expense.date.slice(0, 7)));

  return Array.from(months).sort().slice(-6).map((month) => {
    const monthRecords = records.filter((record) => isInvoiceRecord(record) && record.invoiceDate.slice(0, 7) === month);
    const monthBusinessExpenses = businessExpenses
      .filter((expense) => expense.date.slice(0, 7) === month)
      .reduce((sum, expense) => sum + amount(expense.amount), 0);
    const monthJobRecords = records.map((record) => ({
      ...record,
      expenses: (record.expenses || []).filter((expense) => expense.date.slice(0, 7) === month),
    }));
    const summary = summarizeFinances(monthJobRecords, monthBusinessExpenses);
    return { month, ...summary };
  });
}

export const selectFinancialSummary = createSelector(
  [selectAllRecords, (state: RootState) => state.records.businessExpenses],
  (records, businessExpenses) => summarizeFinances(
    records,
    businessExpenses.reduce((sum, expense) => sum + amount(expense.amount), 0),
  ),
);

export const selectInvoiceRevenue = createSelector(selectFinancialSummary, (summary) => summary.revenue);
export const selectPaidAmount = createSelector(selectFinancialSummary, (summary) => summary.paidAmount);
export const selectOutstandingAmount = createSelector(selectFinancialSummary, (summary) => summary.outstandingAmount);
export const selectJobExpenses = createSelector(selectFinancialSummary, (summary) => summary.jobExpenses);
export const selectBusinessExpenses = createSelector(selectFinancialSummary, (summary) => summary.businessExpenses);
export const selectGrossProfit = createSelector(selectFinancialSummary, (summary) => summary.grossProfit);
export const selectNetProfit = createSelector(selectFinancialSummary, (summary) => summary.netProfit);
export const selectProfitMargin = createSelector(selectFinancialSummary, (summary) => summary.profitMargin);
