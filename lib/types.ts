export type ServiceKey = "painting" | "waterproofing";

export type JobStatus =
  | "enquiry" // draft, nothing printed yet
  | "quotation_sent" // quotation printed, no invoice yet
  | "approved" // customer approved the quotation, ready to start work
  | "invoiced" // invoice created, ₹0 paid
  | "partially_paid" // some payment received
  | "paid" // fully paid
  | "closed" // work delivered & job archived
  | "request_closed"; // quotation did not convert into work

export interface CustomerInfo {
  name: string;
  address: string;
  contact: string;
  site: string;
}

export interface LineItem {
  id: string;
  description: string;
  unit: string;
  qty: number | "";
  rate: number | "";
}

export interface Payment {
  id: string;
  amount: number;
  mode: string;
  date: string; // yyyy-mm-dd
  note?: string;
}

export type ExpenseCategory = "labor" | "material" | "transport" | "other";

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  note?: string;
}

export interface CompanyInfo {
  name: string;
  tagline: string;
  address: string;
  phone1: string;
  phone2: string;
  email: string;
  website: string;
  gstin: string;
}

export interface JobRecord {
  id: string;
  service: ServiceKey;
  status: JobStatus;

  company: CompanyInfo;
  customer: CustomerInfo;
  items: LineItem[];

  discountPercent: number;
  gstEnabled: boolean;
  gstPercent: number;

  quotationNo: string;
  quotationDate: string;
  validityDays: number;
  quotationPrinted: boolean;

  invoiceNo: string;
  invoiceDate: string;
  invoiceCreated: boolean;

  payments: Payment[];
  expenses: Expense[];

  warranty: string;
  paymentTerms: string;
  terms: string;

  createdAt: string;
  updatedAt: string;
}

export interface Totals {
  subtotal: number;
  discountAmount: number;
  taxable: number;
  gstAmount: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
}
