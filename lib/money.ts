import { JobRecord, Totals } from "./types";

export function fmtMoney(n: number): string {
  return Math.round(n).toLocaleString("en-IN");
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function numberToWordsIndian(input: number): string {
  let num = Math.round(input);
  if (num === 0) return "Zero";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const twoDigits = (n: number): string => (n < 20 ? a[n] : b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : ""));
  const threeDigits = (n: number): string =>
    n > 99 ? a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + twoDigits(n % 100) : "") : twoDigits(n);
  let result = "";
  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  const hundred = num;
  if (crore) result += threeDigits(crore) + " Crore ";
  if (lakh) result += threeDigits(lakh) + " Lakh ";
  if (thousand) result += threeDigits(thousand) + " Thousand ";
  if (hundred) result += threeDigits(hundred);
  return result.trim();
}

export function computeTotals(record: JobRecord): Totals {
  const subtotal = record.items.reduce(
    (sum, it) => sum + (Number(it.qty) || 0) * (Number(it.rate) || 0),
    0
  );
  const discountAmount = (subtotal * (Number(record.discountPercent) || 0)) / 100;
  const taxable = subtotal - discountAmount;
  const gstAmount = record.gstEnabled ? (taxable * (Number(record.gstPercent) || 0)) / 100 : 0;
  const total = Math.round(taxable + gstAmount);
  const paidAmount = record.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const balanceDue = Math.max(total - paidAmount, 0);
  return { subtotal, discountAmount, taxable, gstAmount, total, paidAmount, balanceDue };
}

export function newId(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
