"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { addBusinessExpense, addExpense, removeBusinessExpense, removeExpense, selectAllRecords, updateBusinessExpense, updateExpense } from "@/lib/recordsSlice";
import { computeTotals, fmtMoney, formatDate, localDateInput, newId } from "@/lib/money";
import { SERVICES } from "@/lib/services";
import { BusinessExpense, Expense, ExpenseCategory } from "@/lib/types";
import { BUSINESS_EXPENSE_CATEGORIES, JOB_EXPENSE_CATEGORIES, JOB_EXPENSE_COLORS, JOB_EXPENSE_LABELS } from "@/lib/expenseCategories";
import ProtectedPage from "@/components/ProtectedPage";
import FinanceReports from "@/components/FinanceReports";

const CATEGORIES = JOB_EXPENSE_CATEGORIES;
const CATEGORY_LABELS = JOB_EXPENSE_LABELS;
const BUSINESS_CATEGORIES = BUSINESS_EXPENSE_CATEGORIES;

function monthKey(date: string) {
  return date ? date.slice(0, 7) : "";
}

export default function OwnerFinancePage() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const records = useAppSelector(selectAllRecords);
  const businessExpenses = useAppSelector((state) => state.records.businessExpenses || []);
  const [selectedRecordId, setSelectedRecordId] = useState(records[0]?.id || "");
  const [jobSearch, setJobSearch] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("labor");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(localDateInput());
  const [paymentMethod, setPaymentMethod] = useState("");
  const [expenseError, setExpenseError] = useState("");
  const [period, setPeriod] = useState<"all" | "month">("all");
  const [editingExpense, setEditingExpense] = useState<{ recordId: string; expense: Expense } | null>(null);
  const [businessCategory, setBusinessCategory] = useState(BUSINESS_CATEGORIES[0]);
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessAmount, setBusinessAmount] = useState("");
  const [businessDate, setBusinessDate] = useState(localDateInput());
  const [businessVendor, setBusinessVendor] = useState("");
  const [businessPaymentMethod, setBusinessPaymentMethod] = useState("");
  const [businessNotes, setBusinessNotes] = useState("");
  const [businessExpenseError, setBusinessExpenseError] = useState("");
  const [editingBusinessExpense, setEditingBusinessExpense] = useState<BusinessExpense | null>(null);
  const [businessSearch, setBusinessSearch] = useState("");
  const currentMonth = localDateInput().slice(0, 7);
  const activeView = searchParams.get("view") === "reports" ? "reports" : "expenses";

  const filteredRecords = useMemo(() => period === "all" ? records : records.filter((record) =>
    monthKey(record.invoiceDate) === currentMonth ||
    record.payments.some((payment) => monthKey(payment.date) === currentMonth) ||
    (record.expenses || []).some((expense) => monthKey(expense.date) === currentMonth)
  ), [currentMonth, period, records]);
  const recordsWithCosts = [...records].sort((a, b) => Number(b.status === "closed") - Number(a.status === "closed") || (b.expenses?.length || 0) - (a.expenses?.length || 0));
  const searchableRecords = recordsWithCosts.filter((record) => {
    const searchText = [
      record.customer.name,
      record.customer.contact,
      record.quotationNo,
      record.invoiceNo,
      record.customer.site,
      SERVICES[record.service].label,
    ].join(" ").toLowerCase();
    return searchText.includes(jobSearch.trim().toLowerCase());
  });
  const expenseRows = filteredRecords.flatMap((record) => (record.expenses || []).filter((expense) => period === "all" || monthKey(expense.date) === currentMonth).map((expense) => ({ record, expense }))).sort((a, b) => b.expense.date.localeCompare(a.expense.date));

  useEffect(() => {
    if (!jobSearch && !selectedRecordId && records[0]) setSelectedRecordId(records[0].id);
  }, [jobSearch, records, selectedRecordId]);

  useEffect(() => {
    const requestedJob = searchParams.get("job");
    if (!requestedJob || !records.some((record) => record.id === requestedJob)) return;
    setSelectedRecordId(requestedJob);
    document.getElementById("job-expense-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [records, searchParams]);

  function saveExpense(event: FormEvent) {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!selectedRecordId) {
      setExpenseError("Choose a job before adding an expense.");
      return;
    }
    if (category === "other" && !description.trim()) {
      setExpenseError("Enter a description for this cost type.");
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setExpenseError("Enter an amount greater than zero.");
      return;
    }
    const expense = { ...(editingExpense?.expense || {}), id: editingExpense?.expense.id || newId("expense"), category, description: category === "other" ? description.trim() : CATEGORY_LABELS[category], amount: numericAmount, date, paymentMethod: paymentMethod.trim() || undefined };
    if (editingExpense) dispatch(updateExpense({ id: editingExpense.recordId, expense }));
    else dispatch(addExpense({ id: selectedRecordId, expense }));
    setDescription("");
    setAmount("");
    setPaymentMethod("");
    setEditingExpense(null);
    setExpenseError("");
  }

  function editExpense(recordId: string, expense: Expense) {
    setSelectedRecordId(recordId);
    setEditingExpense({ recordId, expense });
    setCategory(expense.category);
    setDescription(expense.description);
    setAmount(String(expense.amount));
    setDate(expense.date);
    setPaymentMethod(expense.paymentMethod || "");
    setExpenseError("");
    document.getElementById("job-expense-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelExpenseEdit() {
    setEditingExpense(null);
    setDescription("");
    setAmount("");
    setPaymentMethod("");
    setExpenseError("");
  }

  function deleteExpense(recordId: string, expenseId: string) {
    if (window.confirm("Remove this expense? This will recalculate the job profit.")) {
      dispatch(removeExpense({ id: recordId, expenseId }));
    }
  }

  function saveBusinessExpense(event: FormEvent) {
    event.preventDefault();
    const numericAmount = Number(businessAmount);
    if (!businessDescription.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setBusinessExpenseError("Enter a description and an amount greater than zero.");
      return;
    }
    const expense: BusinessExpense = { id: editingBusinessExpense?.id || newId("business-expense"), category: businessCategory, description: businessDescription.trim(), amount: numericAmount, date: businessDate, vendor: businessVendor.trim() || undefined, paymentMethod: businessPaymentMethod.trim() || undefined, notes: businessNotes.trim() || undefined };
    dispatch(editingBusinessExpense ? updateBusinessExpense(expense) : addBusinessExpense(expense));
    setBusinessDescription(""); setBusinessAmount(""); setBusinessVendor(""); setBusinessPaymentMethod(""); setBusinessNotes(""); setEditingBusinessExpense(null);
    setBusinessExpenseError("");
  }

  function editBusinessExpense(expense: BusinessExpense) {
    setEditingBusinessExpense(expense); setBusinessCategory(expense.category); setBusinessDescription(expense.description); setBusinessAmount(String(expense.amount)); setBusinessDate(expense.date); setBusinessVendor(expense.vendor || ""); setBusinessPaymentMethod(expense.paymentMethod || ""); setBusinessNotes(expense.notes || "");
    setBusinessExpenseError("");
    document.getElementById("business-expense-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelBusinessExpenseEdit() {
    setEditingBusinessExpense(null);
    setBusinessDescription("");
    setBusinessAmount("");
    setBusinessVendor("");
    setBusinessPaymentMethod("");
    setBusinessNotes("");
    setBusinessExpenseError("");
  }

  function deleteBusinessExpense(expense: BusinessExpense) {
    if (window.confirm(`Remove business expense "${expense.description}" for ₹${fmtMoney(expense.amount)}?`)) {
      dispatch(removeBusinessExpense(expense.id));
    }
  }

  const visibleBusinessExpenses = businessExpenses.filter((expense) =>
    (period === "all" || monthKey(expense.date) === currentMonth) &&
    `${expense.category} ${expense.description} ${expense.vendor || ""}`.toLowerCase().includes(businessSearch.toLowerCase())
  );

  return (
    <ProtectedPage title="Finance" description="Record job and business expenses, then review balances and financial reports.">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-water">Finance</p><h1 className="text-2xl font-display font-bold text-deep">Manage money</h1><p className="text-sm text-muted">Add or update expenses, or switch to reports for the full financial picture.</p></div>
          {activeView === "expenses" && <label className="text-xs text-muted">Show expenses
            <select className="field-input mt-1 !w-auto" value={period} onChange={(event) => setPeriod(event.target.value as "all" | "month")}><option value="all">All time</option><option value="month">This month</option></select>
          </label>}
        </div>
        <nav className="flex gap-2 border-b border-line" aria-label="Finance sections">
          <Link href="/owner?view=expenses" aria-current={activeView === "expenses" ? "page" : undefined} className={`border-b-2 px-3 py-2 text-sm font-semibold ${activeView === "expenses" ? "border-water text-water" : "border-transparent text-muted hover:text-deep"}`}>Expenses</Link>
          <Link href="/owner?view=reports" aria-current={activeView === "reports" ? "page" : undefined} className={`border-b-2 px-3 py-2 text-sm font-semibold ${activeView === "reports" ? "border-water text-water" : "border-transparent text-muted hover:text-deep"}`}>Reports</Link>
        </nav>
        {activeView === "reports" ? <FinanceReports /> : <>
      <section className="panel p-4">
        <div id="job-expense-form" className="mb-4"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-paint">Job costs</p><h2 className="font-display text-xl font-bold text-deep">{editingExpense ? "Update job expense" : "Add job expense"}</h2><p className="text-xs text-muted mt-1">Record labor, materials, travel, or other costs against a customer job.</p></div>
        {!records.length && <p className="mb-3 rounded-md bg-amber-50 p-3 text-sm text-amber-800">Create a customer job before recording a job expense. You can still add general business expenses below.</p>}
        <form onSubmit={saveExpense} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="xl:col-span-2"><label className="field-label" htmlFor="expense-job-search">Search quotation, invoice, or customer</label><input id="expense-job-search" className="field-input mb-2" type="search" value={jobSearch} onChange={(event) => { setJobSearch(event.target.value); setSelectedRecordId(""); }} placeholder="Name, quotation no., invoice no., or phone" /><label className="sr-only" htmlFor="expense-job">Select a job</label><select id="expense-job" className="field-input" value={selectedRecordId} onChange={(event) => setSelectedRecordId(event.target.value)} required><option value="">Select a job</option>{searchableRecords.map((record) => <option key={record.id} value={record.id}>{record.customer.name || "Unnamed customer"} · Q: {record.quotationNo || "—"} · Inv: {record.invoiceNo || "—"}</option>)}</select>{jobSearch && searchableRecords.length === 0 && <p className="mt-1 text-xs text-muted">No quotation, invoice, or customer matches that search.</p>}</div>
          <div><label className="field-label" htmlFor="expense-category">Cost type</label><select id="expense-category" className="field-input" value={category} onChange={(event) => { const nextCategory = event.target.value as ExpenseCategory; setCategory(nextCategory); if (nextCategory === "other") setDescription(""); }}>{CATEGORIES.map((key) => <option key={key} value={key}>{CATEGORY_LABELS[key]}</option>)}</select></div>
          <div><label className="field-label" htmlFor="expense-amount">Amount (₹)</label><input id="expense-amount" className="field-input" type="number" min="1" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" required /></div>
          <div><label className="field-label" htmlFor="expense-date">Date</label><input id="expense-date" className="field-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></div>
          <div className="flex items-end gap-2"><button type="submit" className="btn-primary w-full">{editingExpense ? "Update expense" : "Add expense"}</button>{editingExpense && <button type="button" className="btn-outline" onClick={cancelExpenseEdit}>Cancel</button>}</div>
          {category === "other" && <div className="md:col-span-2 xl:col-span-3"><label className="field-label" htmlFor="expense-description">Description</label><input id="expense-description" className="field-input" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe this cost" required /></div>}
          <div><label className="field-label" htmlFor="expense-payment-method">Payment method</label><input id="expense-payment-method" className="field-input" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} placeholder="Cash, UPI, bank" /></div>
        </form>
        {expenseError && <p className="mt-3 text-sm font-semibold text-red-700" role="alert">{expenseError}</p>}
      </section>

      <section className="panel overflow-hidden"><div className="panel-head"><div><h2>Job expense ledger</h2><p className="mt-1 text-[11px] normal-case tracking-normal text-muted">Edit or remove recorded job costs.</p></div><span className="text-xs text-muted">{expenseRows.length} entries</span></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-xs"><thead><tr className="border-b border-line text-left uppercase tracking-wide text-muted"><th className="px-3 py-3">Date</th><th className="px-3 py-3">Job</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Description</th><th className="px-3 py-3 text-right">Amount</th><th className="px-3 py-3 text-right">Action</th></tr></thead><tbody>{expenseRows.map(({ record, expense }) => <tr key={expense.id} className="border-b border-panel"><td className="px-3 py-3 text-muted">{formatDate(expense.date)}</td><td className="px-3 py-3 font-semibold text-deep">{record.customer.name || "Unnamed customer"}</td><td className="px-3 py-3"><span className="rounded-full px-2 py-1 text-[10px] font-bold" style={{ backgroundColor: `${JOB_EXPENSE_COLORS[expense.category]}18`, color: JOB_EXPENSE_COLORS[expense.category] }}>{CATEGORY_LABELS[expense.category]}</span></td><td className="px-3 py-3 text-muted">{expense.description}{expense.note ? <span className="block text-[10px]">{expense.note}</span> : null}</td><td className="px-3 py-3 text-right font-mono font-semibold text-paint">₹{fmtMoney(expense.amount)}</td><td className="px-3 py-3 text-right"><div className="flex justify-end gap-2"><button type="button" className="action-view" onClick={() => editExpense(record.id, expense)}>Edit</button><button type="button" className="action-view" onClick={() => deleteExpense(record.id, expense.id)}>Remove</button></div></td></tr>)}</tbody></table>{!expenseRows.length && <p className="px-4 py-8 text-center text-sm text-muted">No expenses recorded for this period.</p>}</div></section>
      <section className="panel p-4">
        <div id="business-expense-form">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-water">General company costs</p><h2 className="font-display text-xl font-bold text-deep">Business expenses</h2><p className="mt-1 text-xs text-muted">These costs stay separate from job expenses and reduce net profit.</p></div><input className="field-input max-w-xs" value={businessSearch} onChange={(event) => setBusinessSearch(event.target.value)} placeholder="Search category, description, vendor" /></div>
        <form onSubmit={saveBusinessExpense} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div><label className="field-label" htmlFor="business-category">Category</label><select id="business-category" className="field-input" value={businessCategory} onChange={(event) => setBusinessCategory(event.target.value)}>{BUSINESS_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div><label className="field-label" htmlFor="business-date">Date</label><input id="business-date" className="field-input" type="date" value={businessDate} onChange={(event) => setBusinessDate(event.target.value)} required /></div>
          <div><label className="field-label" htmlFor="business-amount">Amount (₹)</label><input id="business-amount" className="field-input" type="number" min="1" step="0.01" value={businessAmount} onChange={(event) => setBusinessAmount(event.target.value)} required /></div>
          <div><label className="field-label" htmlFor="business-vendor">Vendor / paid to</label><input id="business-vendor" className="field-input" value={businessVendor} onChange={(event) => setBusinessVendor(event.target.value)} /></div>
          <div className="md:col-span-2"><label className="field-label" htmlFor="business-description">Description</label><input id="business-description" className="field-input" value={businessDescription} onChange={(event) => setBusinessDescription(event.target.value)} required /></div>
          <div><label className="field-label" htmlFor="business-payment">Payment method</label><input id="business-payment" className="field-input" value={businessPaymentMethod} onChange={(event) => setBusinessPaymentMethod(event.target.value)} placeholder="Cash, UPI, bank" /></div>
          <div><label className="field-label" htmlFor="business-notes">Notes</label><input id="business-notes" className="field-input" value={businessNotes} onChange={(event) => setBusinessNotes(event.target.value)} /></div>
          <div className="flex items-end gap-2"><button className="btn-primary" type="submit">{editingBusinessExpense ? "Update expense" : "Add expense"}</button>{editingBusinessExpense && <button className="btn-outline" type="button" onClick={cancelBusinessExpenseEdit}>Cancel</button>}</div>
        </form>
        {businessExpenseError && <p className="mt-3 text-sm font-semibold text-red-700" role="alert">{businessExpenseError}</p>}
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[680px] text-xs"><thead><tr className="border-b border-line text-left uppercase tracking-wide text-muted"><th className="px-3 py-3">Date</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Description</th><th className="px-3 py-3">Vendor</th><th className="px-3 py-3 text-right">Amount</th><th className="px-3 py-3 text-right">Action</th></tr></thead><tbody>{visibleBusinessExpenses.map((expense) => <tr key={expense.id} className="border-b border-panel"><td className="px-3 py-3 text-muted">{formatDate(expense.date)}</td><td className="px-3 py-3">{expense.category}</td><td className="px-3 py-3 font-semibold text-deep">{expense.description}<span className="block text-[10px] text-muted">{expense.paymentMethod || ""}{expense.notes ? ` · ${expense.notes}` : ""}</span></td><td className="px-3 py-3 text-muted">{expense.vendor || "—"}</td><td className="px-3 py-3 text-right font-mono font-semibold text-paint">₹{fmtMoney(expense.amount)}</td><td className="px-3 py-3 text-right"><button type="button" className="action-view mr-2" onClick={() => editBusinessExpense(expense)}>Edit</button><button type="button" className="action-view" onClick={() => deleteBusinessExpense(expense)}>Remove</button></td></tr>)}</tbody></table>{!visibleBusinessExpenses.length && <p className="px-4 py-8 text-center text-sm text-muted">No business expenses recorded yet.</p>}</div>
        </div>
      </section>
        </>}
    </div>
    </ProtectedPage>
  );
}