import { google } from "googleapis";
import { NextResponse } from "next/server";
import { computeTotals } from "@/lib/money";
import { summarizeFinances } from "@/lib/financial";
import { BusinessExpense, JobRecord } from "@/lib/types";

export const runtime = "nodejs";

const headers = [
  "Record ID",
  "Service",
  "Status",
  "Customer",
  "Contact",
  "Site / billing address",
  "Quotation No",
  "Quotation Date",
  "Invoice No",
  "Invoice Date",
  "Total",
  "Paid",
  "Balance",
  "Job Expenses",
  "Profit",
  "Updated At",
  "Complete Record JSON",
];

const sheetTables = {
  Jobs: ["Job ID", "Customer", "Service", "Status", "Quotation Amount", "Invoice Amount", "Paid", "Outstanding", "Job Expenses", "Gross Profit", "Profit Margin", "Created", "Updated"],
  Quotations: ["Quotation No", "Job ID", "Customer", "Date", "Amount", "Status"],
  Invoices: ["Invoice No", "Job ID", "Customer", "Date", "Amount", "Paid", "Outstanding", "Status"],
  Payments: ["Payment ID", "Invoice No", "Job ID", "Customer", "Date", "Amount", "Payment Method", "Notes"],
  Expenses: ["Expense ID", "Expense Type", "Job ID", "Customer", "Date", "Category", "Description", "Vendor", "Payment Method", "Amount", "Notes"],
  "Business Expenses": ["Expense ID", "Expense Type", "Date", "Category", "Description", "Vendor", "Payment Method", "Amount", "Notes"],
  "Financial Summary": ["Metric", "Amount"],
} as const;

function envValue(name: string) {
  const value = process.env[name]?.trim() || "";
  return value.replace(/^(["'])(.*)\1$/, "$2");
}

function spreadsheetIdValue() {
  const configured = envValue("GOOGLE_SHEETS_SPREADSHEET_ID");
  const match = configured.match(/\/spreadsheets\/d\/([^/]+)/);
  return match ? match[1] : configured;
}

function getSheetsClient() {
  const clientEmail = envValue("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const privateKey = envValue("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) return null;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

function rowForRecord(record: JobRecord) {
  const totals = computeTotals(record);
  const jobExpenses = (record.expenses || []).reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  return [
    record.id,
    record.service,
    record.status,
    record.customer.name,
    record.customer.contact,
    record.customer.address,
    record.quotationNo,
    record.quotationDate,
    record.invoiceNo,
    record.invoiceDate,
    totals.total,
    totals.paidAmount,
    totals.balanceDue,
    jobExpenses,
    totals.total - jobExpenses,
    record.updatedAt,
    JSON.stringify(record),
  ];
}

function jobRows(records: JobRecord[]) {
  return records.map((record) => {
    const totals = computeTotals(record);
    const expenses = (record.expenses || []).reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
    const revenue = record.invoiceCreated ? totals.total : 0;
    return [record.id, record.customer.name, record.service, record.status, record.quotationPrinted ? totals.total : 0, revenue, totals.paidAmount, totals.balanceDue, expenses, revenue - expenses, revenue ? (revenue - expenses) / revenue : 0, record.createdAt, record.updatedAt];
  });
}

function logicalRows(records: JobRecord[], businessExpenses: BusinessExpense[]) {
  const quotations = records.filter((record) => record.quotationPrinted).map((record) => [record.quotationNo, record.id, record.customer.name, record.quotationDate, computeTotals(record).total, record.status]);
  const invoices = records.filter((record) => record.invoiceCreated).map((record) => { const totals = computeTotals(record); return [record.invoiceNo, record.id, record.customer.name, record.invoiceDate, totals.total, totals.paidAmount, totals.balanceDue, record.status]; });
  const payments = records.flatMap((record) => record.payments.map((payment) => [payment.id, record.invoiceNo, record.id, record.customer.name, payment.date, Number(payment.amount) || 0, payment.mode, payment.note || ""]));
  const expenses = records.flatMap((record) => (record.expenses || []).map((expense) => [expense.id, "Job Expense", record.id, record.customer.name, expense.date, expense.category, expense.description, expense.vendor || "", expense.paymentMethod || "", Number(expense.amount) || 0, expense.notes || expense.note || ""]));
  const business = businessExpenses.map((expense) => [expense.id, "Business Expense", expense.date, expense.category, expense.description, expense.vendor || "", expense.paymentMethod || "", Number(expense.amount) || 0, expense.notes || ""]);
  const summary = summarizeFinances(records, businessExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0));
  const financial = [["Revenue", summary.revenue], ["Paid", summary.paidAmount], ["Outstanding", summary.outstandingAmount], ["Job Expenses", summary.jobExpenses], ["Business Expenses", summary.businessExpenses], ["Gross Profit", summary.grossProfit], ["Net Profit", summary.netProfit], ["Profit Margin", summary.profitMargin / 100]];
  return { quotations, invoices, payments, expenses, business, financial };
}

async function ensureSheet(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string, title: string) {
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets.properties.title" });
  if (spreadsheet.data.sheets?.some((sheet) => sheet.properties?.title === title)) return;
  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [{ addSheet: { properties: { title } } }] } });
}

function columnLetterForIndex(index: number): string {
  let value = index;
  let letters = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    value = Math.floor((value - 1) / 26);
  }
  return letters || "A";
}

async function syncTable(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string, title: string, columns: readonly string[], rows: unknown[][]) {
  await ensureSheet(sheets, spreadsheetId, title);
  const range = `'${title}'!A:Z`;
  const existing = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const values = existing.data.values || [];
  const existingRows = new Map<string, number>();
  values.slice(1).forEach((row, index) => { if (row[0]) existingRows.set(String(row[0]), index + 2); });
  const maxColumns = Math.max(columns.length, ...rows.map((row) => row.length), 1);
  const headerRange = `'${title}'!A1:${columnLetterForIndex(maxColumns)}1`;
  if (!values.length || values[0][0] !== columns[0]) await sheets.spreadsheets.values.update({ spreadsheetId, range: headerRange, valueInputOption: "RAW", requestBody: { values: [columns as unknown as string[]] } });
  for (const row of rows) {
    const normalized = Array.from({ length: maxColumns }, (_, index) => row[index] ?? "");
    const rowNumber = existingRows.get(String(row[0]));
    const endColumn = columnLetterForIndex(Math.max(normalized.length, columns.length));
    if (rowNumber) await sheets.spreadsheets.values.update({ spreadsheetId, range: `'${title}'!A${rowNumber}:${endColumn}${rowNumber}`, valueInputOption: "RAW", requestBody: { values: [normalized] } });
    else await sheets.spreadsheets.values.append({ spreadsheetId, range: `'${title}'!A:${endColumn}`, valueInputOption: "RAW", insertDataOption: "INSERT_ROWS", requestBody: { values: [normalized] } });
  }
}

export async function GET() {
  const spreadsheetId = spreadsheetIdValue();
  const configured = Boolean(spreadsheetId && getSheetsClient());
  return NextResponse.json({ configured, range: envValue("GOOGLE_SHEETS_RANGE") || "Records!A:Q" });
}

export async function POST(request: Request) {
  const spreadsheetId = spreadsheetIdValue();
  const range = envValue("GOOGLE_SHEETS_RANGE") || "Records!A:Q";
  const sheets = getSheetsClient();

  if (!spreadsheetId || !sheets) {
    return NextResponse.json({ error: "Google Sheets is not configured" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as { records?: JobRecord[]; businessExpenses?: BusinessExpense[] };
    const records = Array.isArray(body.records) ? body.records : [];
    const businessExpenses = Array.isArray(body.businessExpenses) ? body.businessExpenses : [];
    if (records.some((record) => !record || typeof record.id !== "string")) {
      return NextResponse.json({ error: "Invalid records payload" }, { status: 400 });
    }

    const existing = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const values = existing.data.values || [];
    const existingRows = new Map<string, number>();
    values.slice(1).forEach((row, index) => {
      if (row[0]) existingRows.set(String(row[0]), index + 2);
    });

    const hasCurrentHeaders = values.length > 0 && headers.every((header, index) => values[0][index] === header);
    if (!hasCurrentHeaders) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: range.split("!")[0] + "!A1:Q1",
        valueInputOption: "RAW",
        requestBody: { values: [headers] },
      });
    }

    for (const record of records) {
      const row = rowForRecord(record);
      const rowNumber = existingRows.get(record.id);
      if (rowNumber) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${range.split("!")[0]}!A${rowNumber}:Q${rowNumber}`,
          valueInputOption: "RAW",
          requestBody: { values: [row] },
        });
      } else {
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range,
          valueInputOption: "RAW",
          insertDataOption: "INSERT_ROWS",
          requestBody: { values: [row] },
        });
      }
    }

    const tables = logicalRows(records, businessExpenses);
    await syncTable(sheets, spreadsheetId, "Jobs", sheetTables.Jobs, jobRows(records));
    await syncTable(sheets, spreadsheetId, "Quotations", sheetTables.Quotations, tables.quotations);
    await syncTable(sheets, spreadsheetId, "Invoices", sheetTables.Invoices, tables.invoices);
    await syncTable(sheets, spreadsheetId, "Payments", sheetTables.Payments, tables.payments);
    await syncTable(sheets, spreadsheetId, "Expenses", sheetTables.Expenses, tables.expenses);
    await syncTable(sheets, spreadsheetId, "Business Expenses", sheetTables["Business Expenses"], tables.business);
    await syncTable(sheets, spreadsheetId, "Financial Summary", sheetTables["Financial Summary"], tables.financial);

    return NextResponse.json({ synced: records.length, businessExpenses: businessExpenses.length });
  } catch (error) {
    console.error("Google Sheets sync failed", error);
    return NextResponse.json({ error: "Google Sheets sync failed" }, { status: 500 });
  }
}