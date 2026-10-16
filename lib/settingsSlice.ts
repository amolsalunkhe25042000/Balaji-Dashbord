import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { JobStatus } from "./types";

export const DASHBOARD_WIDGETS = [
  "managementDashboard",
  "recentWork",
] as const;

export type DashboardWidget = (typeof DASHBOARD_WIDGETS)[number];
export const ALL_JOB_STATUSES: JobStatus[] = ["enquiry", "quotation_sent", "approved", "invoiced", "partially_paid", "paid", "closed", "request_closed"];

export interface SettingsState {
  brandingName: string;
  dashboardWidgets: DashboardWidget[];
}

export const DEFAULT_SETTINGS: SettingsState = {
  brandingName: "Balaji Paints & Waterproof Service",
  dashboardWidgets: [...DASHBOARD_WIDGETS],
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