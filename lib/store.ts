import { configureStore } from "@reduxjs/toolkit";
import recordsReducer, { RecordsState } from "./recordsSlice";
import settingsReducer, { ALL_JOB_STATUSES, DEFAULT_SETTINGS, MANAGEMENT_PANELS, OPERATIONS_COLUMNS, SettingsState } from "./settingsSlice";
import { BusinessExpense, Expense } from "./types";

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

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !parsed.byId ||
      typeof parsed.byId !== "object" ||
      !Array.isArray(parsed.allIds) ||
      !parsed.counters ||
      typeof parsed.counters !== "object"
    ) {
      return undefined;
    }
    const records = parsed as RecordsState;
    if (!Array.isArray(records.businessExpenses)) records.businessExpenses = [];
    records.businessExpenses = records.businessExpenses
      .filter((expense): expense is BusinessExpense => Boolean(expense && typeof expense === "object" && typeof expense.id === "string"))
      .map((expense) => ({
        ...expense,
        amount: Number(expense.amount) || 0,
        description: typeof expense.description === "string" ? expense.description : "",
        date: typeof expense.date === "string" ? expense.date : "",
      }));
    Object.values(records.byId).forEach((record) => {
      if (!Array.isArray(record.expenses)) record.expenses = [];
      record.expenses = record.expenses
        .filter((expense): expense is Expense => Boolean(expense && typeof expense === "object" && typeof expense.id === "string"))
        .map((expense) => ({
          ...expense,
          jobId: expense.jobId || record.id,
          amount: Number(expense.amount) || 0,
          description: typeof expense.description === "string" ? expense.description : "",
          date: typeof expense.date === "string" ? expense.date : "",
          notes: expense.notes ?? expense.note,
        }));
      if (!Array.isArray(record.payments)) record.payments = [];
    });
    return records;
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
