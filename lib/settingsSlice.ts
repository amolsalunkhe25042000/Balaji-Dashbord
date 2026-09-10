import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { JobStatus } from "./types";

export const DASHBOARD_WIDGETS = [
  "totalJobs",
  "customerVisits",
  "pendingApproval",
  "pendingPayment",
  "completeWork",
  "closedRequests",
  "totalCollected",
  "totalPendingAmount",
  "managementDashboard",
  "recentWork",
] as const;

export type DashboardWidget = (typeof DASHBOARD_WIDGETS)[number];
export const MANAGEMENT_PANELS = ["requestStatus", "serviceMix", "cashPosition", "operationsMatrix", "serviceValueMap"] as const;
export type ManagementPanel = (typeof MANAGEMENT_PANELS)[number];
export const OPERATIONS_COLUMNS = ["requests", "share", "value"] as const;
export type OperationsColumn = (typeof OPERATIONS_COLUMNS)[number];
export const ALL_JOB_STATUSES: JobStatus[] = ["enquiry", "quotation_sent", "approved", "invoiced", "partially_paid", "paid", "closed", "request_closed"];

export interface SettingsState {
  brandingName: string;
  dashboardWidgets: DashboardWidget[];
  managementPanels: ManagementPanel[];
  operationsColumns: OperationsColumn[];
  visibleStatuses: JobStatus[];
}

export const DEFAULT_SETTINGS: SettingsState = {
  brandingName: "Balaji Paints & Waterproof Service",
  dashboardWidgets: [...DASHBOARD_WIDGETS],
  managementPanels: [...MANAGEMENT_PANELS],
  operationsColumns: [...OPERATIONS_COLUMNS],
  visibleStatuses: [...ALL_JOB_STATUSES],
};

const settingsSlice = createSlice({
  name: "settings",
  initialState: DEFAULT_SETTINGS,
  reducers: {
    updateSettings(_state, action: PayloadAction<SettingsState>) {
      return action.payload;
    },
    resetSettings() {
      return DEFAULT_SETTINGS;
    },
  },
});

export const { updateSettings, resetSettings } = settingsSlice.actions;
export default settingsSlice.reducer;