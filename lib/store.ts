import { configureStore } from "@reduxjs/toolkit";
import recordsReducer, { RecordsState } from "./recordsSlice";
import settingsReducer, { ALL_JOB_STATUSES, DEFAULT_SETTINGS, MANAGEMENT_PANELS, OPERATIONS_COLUMNS, SettingsState } from "./settingsSlice";
import { BusinessExpense, Expense, JobRecord, JobStatus, LineItem, Payment, ServiceKey } from "./types";

const VALID_SERVICES = new Set<ServiceKey>(["painting", "waterproofing"]);

function toNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function sanitizeRecord(raw: unknown): JobRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const id = toString(record.id);
  if (!id) return null;

  const service = typeof record.service === "string" && VALID_SERVICES.has(record.service as ServiceKey)
    ? (record.service as ServiceKey)
    : "painting";
  const status = typeof record.status === "string" && ALL_JOB_STATUSES.includes(record.status as JobStatus)
    ? (record.status as JobStatus)
    : "enquiry";

  const customerObject = record.customer && typeof record.customer === "object" ? (record.customer as Record<string, unknown>) : {};
  const companyObject = record.company && typeof record.company === "object" ? (record.company as Record<string, unknown>) : {};

  const customer = {
    name: toString(customerObject.name),
    address: toString(customerObject.address),
    contact: toString(customerObject.contact),
    site: toString(customerObject.site),
  };

  const company = {
    name: toString(companyObject.name),
    tagline: toString(companyObject.tagline),
    address: toString(companyObject.address),
    phone1: toString(companyObject.phone1),
    phone2: toString(companyObject.phone2),
    email: toString(companyObject.email),
    website: toString(companyObject.website),
    gstin: toString(companyObject.gstin),
  };

  const items: LineItem[] = Array.isArray(record.items)
    ? record.items.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const entry = item as Record<string, unknown>;
        return [{
          id: toString(entry.id) || `item-${Math.random().toString(36).slice(2, 8)}`,
          description: toString(entry.description),
          unit: toString(entry.unit),
          qty: typeof entry.qty === "number" ? entry.qty : (typeof entry.qty === "string" && entry.qty.trim() ? Number(entry.qty) || "" : ""),
          rate: typeof entry.rate === "number" ? entry.rate : (typeof entry.rate === "string" && entry.rate.trim() ? Number(entry.rate) || "" : ""),
        }];
      })
    : [];

  const payments: Payment[] = Array.isArray(record.payments)
    ? record.payments.flatMap((payment) => {
        if (!payment || typeof payment !== "object") return [];
        const entry = payment as Record<string, unknown>;
        const amount = toNumber(entry.amount, 0);
        if (!entry.id || amount <= 0) return [];
        return [{
          id: toString(entry.id),
          amount,
          mode: toString(entry.mode),
          date: toString(entry.date),
          note: typeof entry.note === "string" ? entry.note : undefined,
        }];
      })
    : [];

  const expenses: Expense[] = Array.isArray(record.expenses)
    ? record.expenses.flatMap((expense) => {
        if (!expense || typeof expense !== "object") return [];
        const entry = expense as Record<string, unknown>;
        const amount = toNumber(entry.amount, 0);
        if (!entry.id || amount <= 0) return [];
        return [{
          id: toString(entry.id),
          category: (typeof entry.category === "string" ? entry.category : "other") as Expense["category"],
          description: toString(entry.description),
          amount,
          date: toString(entry.date),
          vendor: typeof entry.vendor === "string" ? entry.vendor : undefined,
          paymentMethod: typeof entry.paymentMethod === "string" ? entry.paymentMethod : undefined,
          notes: typeof entry.notes === "string" ? entry.notes : (typeof entry.note === "string" ? entry.note : undefined),
          note: typeof entry.note === "string" ? entry.note : undefined,
          jobId: typeof entry.jobId === "string" ? entry.jobId : id,
        }];
      })
    : [];

  return {
    id,
    service,
    status,
    company,
    customer,
    items,
    discountPercent: toNumber(record.discountPercent, 0),
    gstEnabled: Boolean(record.gstEnabled),
    gstPercent: toNumber(record.gstPercent, 18),
    quotationNo: toString(record.quotationNo),
    quotationDate: toString(record.quotationDate),
    validityDays: Math.max(0, Math.round(toNumber(record.validityDays, 15))),
    quotationPrinted: Boolean(record.quotationPrinted),
    invoiceNo: toString(record.invoiceNo),
    invoiceDate: toString(record.invoiceDate),
    invoiceCreated: Boolean(record.invoiceCreated),
    payments,
    expenses,
    warranty: toString(record.warranty),
    paymentTerms: toString(record.paymentTerms),
    terms: toString(record.terms),
    createdAt: toString(record.createdAt) || new Date().toISOString(),
    updatedAt: toString(record.updatedAt) || new Date().toISOString(),
  };
}

export const STORAGE_KEY = "balaji_crm_state_v1";
export const SETTINGS_STORAGE_KEY = "balaji_crm_settings_v1";

export async function syncRecordsToGoogleSheets(records: RecordsState): Promise<boolean> {
  if (process.env.NEXT_PUBLIC_ENABLE_SHEETS_SYNC !== "true") return false;
  try {
    const response = await fetch("/api/sheets/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records: Object.values(records.byId), businessExpenses: records.businessExpenses || [] }),
      keepalive: true,
    });
    if (!response.ok) {
      console.error("Google Sheets sync failed", await response.text());
      return false;
    }
    return true;
  } catch {
    // Local storage remains the offline fallback when the API is unavailable.
    return false;
  }
}

export function loadStoredRecords() {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<RecordsState>;

    if (!parsed || typeof parsed !== "object" || !parsed.byId || typeof parsed.byId !== "object" || !Array.isArray(parsed.allIds) || !parsed.counters || typeof parsed.counters !== "object") {
      return undefined;
    }

    const byId = Object.entries(parsed.byId).reduce<Record<string, JobRecord>>((acc, [id, value]) => {
      const sanitized = sanitizeRecord(value);
      if (sanitized && id === sanitized.id) acc[id] = sanitized;
      return acc;
    }, {});

    const records: RecordsState = {
      byId,
      allIds: parsed.allIds.filter((id) => typeof id === "string" && byId[id]).map(String),
      counters: Object.fromEntries(Object.entries(parsed.counters).filter(([key, value]) => typeof key === "string" && typeof value === "number" && Number.isFinite(value))),
      businessExpenses: Array.isArray(parsed.businessExpenses)
        ? parsed.businessExpenses.flatMap((expense) => {
            if (!expense || typeof expense !== "object") return [];
            const entry = expense as unknown as Record<string, unknown>;
            const amount = toNumber(entry.amount, 0);
            if (!entry.id || amount <= 0) return [];
            return [{
              id: toString(entry.id),
              category: toString(entry.category),
              description: toString(entry.description),
              amount,
              date: toString(entry.date),
              vendor: typeof entry.vendor === "string" ? entry.vendor : undefined,
              paymentMethod: typeof entry.paymentMethod === "string" ? entry.paymentMethod : undefined,
              notes: typeof entry.notes === "string" ? entry.notes : undefined,
            }];
          })
        : [],
    };

    return records.allIds.length ? records : undefined;
  } catch {
    return undefined;
  }
}

export function loadStoredSettings(): SettingsState | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<SettingsState>;
    if (!parsed || typeof parsed.brandingName !== "string" || !Array.isArray(parsed.dashboardWidgets)) {
      return undefined;
    }
    const dashboardWidgets = parsed.dashboardWidgets.filter((widget) =>
      DEFAULT_SETTINGS.dashboardWidgets.includes(widget as (typeof DEFAULT_SETTINGS.dashboardWidgets)[number])
    ) as SettingsState["dashboardWidgets"];
    const managementPanels = Array.isArray(parsed.managementPanels)
      ? parsed.managementPanels.filter((panel) => MANAGEMENT_PANELS.includes(panel as (typeof MANAGEMENT_PANELS)[number])) as SettingsState["managementPanels"]
      : [...DEFAULT_SETTINGS.managementPanels];
    const operationsColumns = Array.isArray(parsed.operationsColumns)
      ? parsed.operationsColumns.filter((column) => OPERATIONS_COLUMNS.includes(column as (typeof OPERATIONS_COLUMNS)[number])) as SettingsState["operationsColumns"]
      : [...DEFAULT_SETTINGS.operationsColumns];
    const visibleStatuses = Array.isArray(parsed.visibleStatuses)
      ? parsed.visibleStatuses.filter((status) => ALL_JOB_STATUSES.includes(status as (typeof ALL_JOB_STATUSES)[number])) as SettingsState["visibleStatuses"]
      : [...DEFAULT_SETTINGS.visibleStatuses];
    return {
      brandingName: parsed.brandingName.trim() || DEFAULT_SETTINGS.brandingName,
      dashboardWidgets: dashboardWidgets.length ? dashboardWidgets : [...DEFAULT_SETTINGS.dashboardWidgets],
      managementPanels: managementPanels.length ? managementPanels : [...DEFAULT_SETTINGS.managementPanels],
      operationsColumns: operationsColumns.length ? operationsColumns : [...DEFAULT_SETTINGS.operationsColumns],
      visibleStatuses: visibleStatuses.length ? visibleStatuses : [...DEFAULT_SETTINGS.visibleStatuses],
    };
  } catch {
    return undefined;
  }
}

export function saveStoredSettings(settings: SettingsState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore quota / private-browsing errors */
  }
}

export function makeStore() {
  const store = configureStore({
    reducer: { records: recordsReducer, settings: settingsReducer },
  });

  if (typeof window !== "undefined") {
    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    let sheetsTimer: ReturnType<typeof setTimeout> | null = null;
    store.subscribe(() => {
      if (saveTimer) clearTimeout(saveTimer);
      if (sheetsTimer) clearTimeout(sheetsTimer);
      // debounce so rapid typing doesn't hammer localStorage
      saveTimer = setTimeout(() => {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store.getState().records));
          saveStoredSettings(store.getState().settings);
        } catch {
          /* ignore quota / private-browsing errors */
        }
      }, 250);
      sheetsTimer = setTimeout(() => {
        void syncRecordsToGoogleSheets(store.getState().records);
      }, 750);
    });
  }

  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
