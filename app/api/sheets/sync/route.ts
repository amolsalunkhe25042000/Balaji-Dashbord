import { google } from "googleapis";
import { NextResponse } from "next/server";
import { computeTotals } from "@/lib/money";
import { JobRecord } from "@/lib/types";

export const runtime = "nodejs";

const headers = [
  "Record ID",
  "Service",
  "Status",
  "Customer",
  "Contact",
  "Quotation No",
  "Quotation Date",
  "Invoice No",
  "Invoice Date",
  "Total",
  "Paid",
  "Balance",
  "Updated At",
  "Complete Record JSON",
];

function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!clientEmail || !privateKey) return null;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

function rowForRecord(record: JobRecord) {
  const totals = computeTotals(record);
  return [
    record.id,
    record.service,
    record.status,
    record.customer.name,
    record.customer.contact,
    record.quotationNo,
    record.quotationDate,
    record.invoiceNo,
    record.invoiceDate,
    totals.total,
    totals.paidAmount,
    totals.balanceDue,
    record.updatedAt,
    JSON.stringify(record),
  ];
}

export async function POST(request: Request) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const range = process.env.GOOGLE_SHEETS_RANGE || "Records!A:N";
  const sheets = getSheetsClient();

  if (!spreadsheetId || !sheets) {
    return NextResponse.json({ error: "Google Sheets is not configured" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as { records?: JobRecord[] };
    const records = Array.isArray(body.records) ? body.records : [];
    if (records.some((record) => !record || typeof record.id !== "string")) {
      return NextResponse.json({ error: "Invalid records payload" }, { status: 400 });
    }

    const existing = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const values = existing.data.values || [];
    const existingRows = new Map<string, number>();
    values.slice(1).forEach((row, index) => {
      if (row[0]) existingRows.set(String(row[0]), index + 2);
    });

    if (!values.length || values[0][0] !== headers[0]) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: range.split("!")[0] + "!A1:N1",
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
          range: `${range.split("!")[0]}!A${rowNumber}:N${rowNumber}`,
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

    return NextResponse.json({ synced: records.length });
  } catch (error) {
    console.error("Google Sheets sync failed", error);
    return NextResponse.json({ error: "Google Sheets sync failed" }, { status: 500 });
  }
}