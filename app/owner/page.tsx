"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { addExpense, removeExpense, selectAllRecords, updateExpense } from "@/lib/recordsSlice";
import { computeTotals, fmtMoney, formatDate, isInvoiceRecord, newId } from "@/lib/money";
import { SERVICES } from "@/lib/services";
import { Expense, ExpenseCategory } from "@/lib/types";
import ProtectedPage from "@/components/ProtectedPage";

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  labor: "Labor charges",
  material: "Materials",
  transport: "Transport",
  other: "Other expense",
};
const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  labor: "#D9622B",
  material: "#0F8B8D",
  transport: "#2563EB",
  other: "#7C3AED",
};
const CATEGORIES = Object.keys(CATEGORY_LABELS) as ExpenseCategory[];

function monthLabel(date: string) {
  return new Date(`${date.slice(0, 7)}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

function monthKey(date: string) {
  return date ? date.slice(0, 7) : "";
}

export default function OwnerFinancePage() {
  const dispatch = useAppDispatch();
  const records = useAppSelector(selectAllRecords);
  const [selectedRecordId, setSelectedRecordId] = useState(records[0]?.id || "");
  const [category, setCategory] = useState<ExpenseCategory>("labor");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [period, setPeriod] = useState<"all" | "month">("all");
  const [editingExpense, setEditingExpense] = useState<{ recordId: string; expense: Expense } | null>(null);
  const currentMonth = new Date().toISOString().slice(0, 7);

  const filteredRecords = useMemo(() => period === "all" ? records : records.filter((record) =>
    monthKey(record.invoiceDate) === currentMonth ||
    record.payments.some((payment) => monthKey(payment.date) === currentMonth) ||
    (record.expenses || []).some((expense) => monthKey(expense.date) === currentMonth)
  ), [currentMonth, period, records]);
  const stats = useMemo(() => filteredRecords.reduce((summary, record) => {
    const totals = computeTotals(record);
    const billed = isInvoiceRecord(record) && (period === "all" || monthKey(record.invoiceDate) === currentMonth) ? totals.total : 0;
    const collected = isInvoiceRecord(record)
      ? record.payments.filter((payment) => period === "all" || monthKey(payment.date) === currentMonth).reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
      : 0;
    const expenses = (record.expenses || []).filter((expense) => period === "all" || monthKey(expense.date) === currentMonth).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    summary.billed += billed;
    summary.collected += collected;
    summary.expenses += expenses;
    return summary;
  }, { billed: 0, collected: 0, expenses: 0 }), [currentMonth, filteredRecords, period]);
  const billedProfit = stats.billed - stats.expenses;
  const cashProfit = stats.collected - stats.expenses;
  const loss = Math.max(0, -billedProfit);

  const expenseBreakdown = CATEGORIES.map((key) => ({ name: CATEGORY_LABELS[key], value: filteredRecords.reduce((sum, record) => sum + (record.expenses || []).filter((expense) => expense.category === key && (period === "all" || monthKey(expense.date) === currentMonth)).reduce((total, expense) => total + expense.amount, 0), 0), fill: CATEGORY_COLORS[key] })).filter((item) => item.value > 0);
  const chartData = Array.from(new Set(filteredRecords.flatMap((record) => [monthKey(record.invoiceDate), ...(record.expenses || []).map((expense) => monthKey(expense.date))].filter(Boolean)))).sort().slice(-6).map((month) => {
    const monthRecords = filteredRecords.filter((record) => monthKey(record.invoiceDate) === month);
    const revenue = monthRecords.reduce((sum, record) => sum + (isInvoiceRecord(record) ? computeTotals(record).total : 0), 0);
    const expenses = filteredRecords.reduce((sum, record) => sum + (record.expenses || []).filter((expense) => expense.date.slice(0, 7) === month).reduce((total, expense) => total + expense.amount, 0), 0);
    return { month: monthLabel(`${month}-01`), revenue, expenses, profit: revenue - expenses };
  });
  const recordsWithCosts = [...filteredRecords].sort((a, b) => Number(b.status === "closed") - Number(a.status === "closed") || (b.expenses?.length || 0) - (a.expenses?.length || 0));
  const expenseRows = filteredRecords.flatMap((record) => (record.expenses || []).filter((expense) => period === "all" || monthKey(expense.date) === currentMonth).map((expense) => ({ record, expense }))).sort((a, b) => b.expense.date.localeCompare(a.expense.date));

  useEffect(() => {
    if (!selectedRecordId && records[0]) setSelectedRecordId(records[0].id);
  }, [records, selectedRecordId]);

  function saveExpense(event: FormEvent) {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!selectedRecordId || !description.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) return;
    const expense = { id: editingExpense?.expense.id || newId("expense"), category, description: description.trim(), amount: numericAmount, date, note: note.trim() || undefined };
    if (editingExpense) dispatch(updateExpense({ id: editingExpense.recordId, expense }));
    else dispatch(addExpense({ id: selectedRecordId, expense }));
    setDescription("");
    setAmount("");
    setNote("");
    setEditingExpense(null);
  }

  function editExpense(recordId: string, expense: Expense) {
    setSelectedRecordId(recordId);
    setEditingExpense({ recordId, expense });
    setCategory(expense.category);
    setDescription(expense.description);
    setAmount(String(expense.amount));
    setDate(expense.date);
    setNote(expense.note || "");
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  function deleteExpense(recordId: string, expenseId: string) {
    if (window.confirm("Remove this expense? This will recalculate the job profit.")) {
      dispatch(removeExpense({ id: recordId, expenseId }));
    }
  }

  return (
    <ProtectedPage title="Profit & expense control" description="Review revenue, expenses, and job profit before sharing financial information.">
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-paint">Owner view</p><h1 className="text-2xl font-display font-bold text-deep">Profit &amp; expense control</h1><p className="text-sm text-muted">See what each job earns after labor, material, transport, and other costs.</p></div>
        <div className="flex gap-2"><select className="field-input !w-auto text-xs" value={period} onChange={(event) => setPeriod(event.target.value as "all" | "month")}><option value="all">All time</option><option value="month">This month</option></select><Link href="/" className="btn-outline text-xs">Dashboard</Link></div>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-5">
        <div className="panel p-4"><p className="text-xs text-muted">Billed revenue</p><p className="mt-2 font-display text-xl font-bold text-deep">₹ {fmtMoney(stats.billed)}</p><p className="mt-1 text-[11px] text-muted">Invoice totals</p></div>
        <div className="panel p-4"><p className="text-xs text-muted">Collected cash</p><p className="mt-2 font-display text-xl font-bold text-water">₹ {fmtMoney(stats.collected)}</p><p className="mt-1 text-[11px] text-muted">Payments received</p></div>
        <div className="panel p-4"><p className="text-xs text-muted">Total expenses</p><p className="mt-2 font-display text-xl font-bold text-paint">₹ {fmtMoney(stats.expenses)}</p><p className="mt-1 text-[11px] text-muted">All recorded costs</p></div>
        <div className={`panel p-4 ${billedProfit >= 0 ? "border-emerald-200" : "border-red-200"}`}><p className="text-xs text-muted">Net profit</p><p className={`mt-2 font-display text-xl font-bold ${billedProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>₹ {fmtMoney(billedProfit)}</p><p className="mt-1 text-[11px] text-muted">Revenue minus expenses</p></div>
        <div className="panel p-4"><p className="text-xs text-muted">Cash profit</p><p className="mt-2 font-display text-xl font-bold text-deep">₹ {fmtMoney(cashProfit)}</p><p className="mt-1 text-[11px] text-muted">Collected minus expenses</p></div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="panel p-4 xl:col-span-2"><div className="mb-3"><h2 className="font-display font-bold text-deep">Revenue versus expenses</h2><p className="text-xs text-muted">Automatic monthly view from invoices and expense entries.</p></div><div className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#D8DDD9" /><XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `₹${fmtMoney(value)}`} /><Tooltip formatter={(value) => `₹${fmtMoney(Number(value) || 0)}`} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="revenue" name="Revenue" fill="#0F8B8D" radius={[4, 4, 0, 0]} /><Bar dataKey="expenses" name="Expenses" fill="#D9622B" radius={[4, 4, 0, 0]} /><Bar dataKey="profit" name="Profit / loss" fill="#334155" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
        <div className="panel p-4"><div className="mb-3"><h2 className="font-display font-bold text-deep">Expense mix</h2><p className="text-xs text-muted">Where the money is going.</p></div><div className="h-[260px]">{expenseBreakdown.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={expenseBreakdown} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="75%" paddingAngle={3}>{expenseBreakdown.map((item) => <Cell key={item.name} fill={item.fill} />)}</Pie><Tooltip formatter={(value) => `₹${fmtMoney(Number(value) || 0)}`} /><Legend wrapperStyle={{ fontSize: 10 }} /></PieChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-center text-sm text-muted">Add job costs to see the expense mix.</div>}</div></div>
      </div>

      <section className="panel p-4">
        <div className="mb-4"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-paint">Job cost entry</p><h2 className="font-display text-xl font-bold text-deep">Record a completed-job expense</h2><p className="text-xs text-muted mt-1">Add labor, material, travel, or any other cost against the visit that created it.</p></div>
        <form onSubmit={saveExpense} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="xl:col-span-2"><label className="field-label" htmlFor="expense-job">Job / customer</label><select id="expense-job" className="field-input" value={selectedRecordId} onChange={(event) => setSelectedRecordId(event.target.value)}><option value="">Select a job</option>{recordsWithCosts.map((record) => <option key={record.id} value={record.id}>{record.customer.name || "Unnamed customer"} · {SERVICES[record.service].label}</option>)}</select></div>
          <div><label className="field-label" htmlFor="expense-category">Cost type</label><select id="expense-category" className="field-input" value={category} onChange={(event) => setCategory(event.target.value as ExpenseCategory)}>{CATEGORIES.map((key) => <option key={key} value={key}>{CATEGORY_LABELS[key]}</option>)}</select></div>
          <div><label className="field-label" htmlFor="expense-amount">Amount (₹)</label><input id="expense-amount" className="field-input" type="number" min="1" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" required /></div>
          <div><label className="field-label" htmlFor="expense-date">Date</label><input id="expense-date" className="field-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></div>
          <div className="flex items-end gap-2"><button type="submit" className="btn-primary w-full">{editingExpense ? "Update expense" : "Add expense"}</button>{editingExpense && <button type="button" className="btn-outline" onClick={() => { setEditingExpense(null); setDescription(""); setAmount(""); setNote(""); }}>Cancel</button>}</div>
          <div className="md:col-span-2 xl:col-span-3"><label className="field-label" htmlFor="expense-description">Description</label><input id="expense-description" className="field-input" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="e.g. 2 painters for 3 days" required /></div>
          <div className="md:col-span-2 xl:col-span-3"><label className="field-label" htmlFor="expense-note">Note (optional)</label><input id="expense-note" className="field-input" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Supplier, bill number, or payment note" /></div>
        </form>
      </section>

      <section className="panel overflow-hidden"><div className="panel-head"><div><h2>Job profitability</h2><p className="mt-1 text-[11px] normal-case tracking-normal text-muted">Profit is calculated from billed invoice total minus all expenses.</p></div><span className="text-xs text-muted">{filteredRecords.length} jobs</span></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-xs"><thead><tr className="border-b border-line text-left uppercase tracking-wide text-muted"><th className="px-3 py-3">Customer</th><th className="px-3 py-3">Status</th><th className="px-3 py-3 text-right">Invoice</th><th className="px-3 py-3 text-right">Collected</th><th className="px-3 py-3 text-right">Expense</th><th className="px-3 py-3 text-right">Profit / loss</th><th className="px-3 py-3 text-right">Action</th></tr></thead><tbody>{recordsWithCosts.map((record) => { const totals = computeTotals(record); const revenue = isInvoiceRecord(record) && (period === "all" || monthKey(record.invoiceDate) === currentMonth) ? totals.total : 0; const collected = isInvoiceRecord(record) ? record.payments.filter((payment) => period === "all" || monthKey(payment.date) === currentMonth).reduce((sum, payment) => sum + payment.amount, 0) : 0; const expenseTotal = (record.expenses || []).filter((expense) => period === "all" || monthKey(expense.date) === currentMonth).reduce((sum, expense) => sum + expense.amount, 0); const profit = revenue - expenseTotal; return <tr key={record.id} className="border-b border-panel"><td className="px-3 py-3"><div className="font-semibold text-deep">{record.customer.name || "Unnamed customer"}</div><div className="text-[11px] text-muted">{SERVICES[record.service].label} · {record.expenses?.length || 0} costs</div></td><td className="px-3 py-3 capitalize text-muted">{record.status.replaceAll("_", " ")}</td><td className="px-3 py-3 text-right font-mono">₹{fmtMoney(revenue)}</td><td className="px-3 py-3 text-right font-mono text-water">₹{fmtMoney(collected)}</td><td className="px-3 py-3 text-right font-mono text-paint">₹{fmtMoney(expenseTotal)}</td><td className={`px-3 py-3 text-right font-mono font-bold ${profit >= 0 ? "text-emerald-700" : "text-red-700"}`}>{profit < 0 ? "-" : ""}₹{fmtMoney(Math.abs(profit))}</td><td className="px-3 py-3 text-right"><Link href={record.invoiceCreated ? `/record/${record.id}/invoice` : `/record/${record.id}/quotation`} className="action-view">Open job</Link></td></tr> })}</tbody></table></div><div className="flex flex-wrap gap-4 border-t border-line bg-panel px-3 py-3 text-xs"><span className="font-semibold text-deep">Loss total: <b className="text-red-700">₹{fmtMoney(loss)}</b></span><span className="text-muted">Pending collection: ₹{fmtMoney(Math.max(stats.billed - stats.collected, 0))}</span></div></section>
      <section className="panel overflow-hidden"><div className="panel-head"><div><h2>Expense ledger</h2><p className="mt-1 text-[11px] normal-case tracking-normal text-muted">Correct or remove individual costs whenever needed.</p></div><span className="text-xs text-muted">{expenseRows.length} entries</span></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-xs"><thead><tr className="border-b border-line text-left uppercase tracking-wide text-muted"><th className="px-3 py-3">Date</th><th className="px-3 py-3">Job</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Description</th><th className="px-3 py-3 text-right">Amount</th><th className="px-3 py-3 text-right">Action</th></tr></thead><tbody>{expenseRows.map(({ record, expense }) => <tr key={expense.id} className="border-b border-panel"><td className="px-3 py-3 text-muted">{formatDate(expense.date)}</td><td className="px-3 py-3 font-semibold text-deep">{record.customer.name || "Unnamed customer"}</td><td className="px-3 py-3"><span className="rounded-full px-2 py-1 text-[10px] font-bold" style={{ backgroundColor: `${CATEGORY_COLORS[expense.category]}18`, color: CATEGORY_COLORS[expense.category] }}>{CATEGORY_LABELS[expense.category]}</span></td><td className="px-3 py-3 text-muted">{expense.description}{expense.note ? <span className="block text-[10px]">{expense.note}</span> : null}</td><td className="px-3 py-3 text-right font-mono font-semibold text-paint">₹{fmtMoney(expense.amount)}</td><td className="px-3 py-3 text-right"><div className="flex justify-end gap-2"><button type="button" className="action-view" onClick={() => editExpense(record.id, expense)}>Edit</button><button type="button" className="action-view" onClick={() => deleteExpense(record.id, expense.id)}>Remove</button></div></td></tr>)}</tbody></table>{!expenseRows.length && <p className="px-4 py-8 text-center text-sm text-muted">No expenses recorded for this period.</p>}</div></section>
    </div>
    </ProtectedPage>
  );
}