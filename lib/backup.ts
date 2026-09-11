import { RecordsState } from "./recordsSlice";
import { DEFAULT_SETTINGS, SettingsState } from "./settingsSlice";

export interface CrmBackup {
  format: "balaji-crm-backup";
  version: 1;
  exportedAt: string;
  records: RecordsState;
  settings: SettingsState;
}

export function createBackup(records: RecordsState, settings: SettingsState): CrmBackup {
  return { format: "balaji-crm-backup", version: 1, exportedAt: new Date().toISOString(), records, settings };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function parseBackup(value: unknown): CrmBackup | null {
  if (!isObject(value) || value.format !== "balaji-crm-backup" || value.version !== 1 || !isObject(value.records) || !isObject(value.settings)) return null;
  const records = value.records as Partial<RecordsState>;
  const settings = value.settings as Partial<SettingsState>;
  if (!isObject(records.byId) || !Array.isArray(records.allIds) || !isObject(records.counters) || !Array.isArray(records.businessExpenses)) return null;
  if (typeof settings.brandingName !== "string" || !Array.isArray(settings.dashboardWidgets)) return null;
  return {
    format: "balaji-crm-backup",
    version: 1,
    exportedAt: typeof value.exportedAt === "string" ? value.exportedAt : new Date().toISOString(),
    records: { ...records, businessExpenses: records.businessExpenses } as RecordsState,
    settings: { ...DEFAULT_SETTINGS, ...settings } as SettingsState,
  };
}

export function backupSummary(backup: CrmBackup): string {
  return `${backup.records.allIds.length} jobs, ${backup.records.businessExpenses.length} business expenses, exported ${new Date(backup.exportedAt).toLocaleString("en-IN")}`;
}
