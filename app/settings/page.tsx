"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { deleteRecord, hydrate, selectAllRecords } from "@/lib/recordsSlice";
import { ALL_JOB_STATUSES, DASHBOARD_WIDGETS, DEFAULT_SETTINGS, DashboardWidget, MANAGEMENT_PANELS, ManagementPanel, OPERATIONS_COLUMNS, OperationsColumn, updateSettings, resetSettings } from "@/lib/settingsSlice";
import { saveStoredSettings, syncRecordsToGoogleSheets } from "@/lib/store";
import ProtectedPage from "@/components/ProtectedPage";
import { backupSummary, createBackup, parseBackup } from "@/lib/backup";

const WIDGET_LABELS: Record<DashboardWidget, string> = {
  totalJobs: "Total jobs",
  customerVisits: "Customer visits",
  pendingApproval: "Pending approval",
  pendingPayment: "Pending payment",
  completeWork: "Complete work",
  closedRequests: "Closed requests",
  totalCollected: "Total collected",
  totalPendingAmount: "Total pending amount",
  managementDashboard: "Management charts and tables",
  recentWork: "Recent work list",
};

const PANEL_LABELS: Record<ManagementPanel, string> = {
  requestStatus: "Request status chart",
  serviceMix: "Service mix chart",
  cashPosition: "Cash position chart",
  operationsMatrix: "Operations matrix",
  serviceValueMap: "Service value map",
};

const COLUMN_LABELS: Record<OperationsColumn, string> = {
  requests: "Request count",
  share: "Percentage share",
  value: "Quoted value",
};

const STATUS_LABELS: Record<(typeof ALL_JOB_STATUSES)[number], string> = {
  enquiry: "Enquiry",
  quotation_sent: "Quotation sent",
  approved: "Approved",
  invoiced: "Pending payment",
  partially_paid: "Partially paid",
  paid: "Paid",
  closed: "Work complete",
  request_closed: "Request closed",
};

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const savedSettings = useAppSelector((state) => state.settings);
  const records = useAppSelector(selectAllRecords);
  const recordsState = useAppSelector((state) => state.records);
  const [brandingName, setBrandingName] = useState(savedSettings.brandingName);
  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidget[]>(savedSettings.dashboardWidgets);
  const [managementPanels, setManagementPanels] = useState<ManagementPanel[]>(savedSettings.managementPanels);
  const [operationsColumns, setOperationsColumns] = useState<OperationsColumn[]>(savedSettings.operationsColumns);
  const [visibleStatuses, setVisibleStatuses] = useState(savedSettings.visibleStatuses);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "failed">("idle");
  const [lastSync, setLastSync] = useState("");
  const [backupMessage, setBackupMessage] = useState("");

  useEffect(() => {
    setBrandingName(savedSettings.brandingName);
    setDashboardWidgets(savedSettings.dashboardWidgets);
    setManagementPanels(savedSettings.managementPanels);
    setOperationsColumns(savedSettings.operationsColumns);
    setVisibleStatuses(savedSettings.visibleStatuses);
  }, [savedSettings]);

  function toggleWidget(widget: DashboardWidget) {
    setDashboardWidgets((current) => current.includes(widget) ? current.filter((item) => item !== widget) : [...current, widget]);
  }

  function downloadBackup() {
    const backup = createBackup(recordsState, savedSettings);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Balaji_CRM_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setBackupMessage("Backup downloaded.");
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = parseBackup(JSON.parse(await file.text()));
      if (!parsed) { setBackupMessage("This file is not a valid Balaji CRM backup."); return; }
      if (!window.confirm(`Import backup? This will replace current jobs and settings with ${backupSummary(parsed)}.`)) return;
      dispatch(hydrate(parsed.records));
      dispatch(updateSettings(parsed.settings));
      saveStoredSettings(parsed.settings);
      setBackupMessage("Backup imported successfully.");
    } catch {
      setBackupMessage("The backup file could not be read.");
    }
  }

  async function syncNow() {
    setSyncStatus("syncing");
    const success = await syncRecordsToGoogleSheets(recordsState);
    setSyncStatus(success ? "success" : "failed");
    if (success) setLastSync(new Date().toLocaleString("en-IN"));
  }

  function toggleSetting<T extends string>(value: T, setter: React.Dispatch<React.SetStateAction<T[]>>) {
    setter((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  function saveSettings(event: FormEvent) {
    event.preventDefault();
    const nextSettings = { brandingName: brandingName.trim() || DEFAULT_SETTINGS.brandingName, dashboardWidgets, managementPanels, operationsColumns, visibleStatuses };
    dispatch(updateSettings(nextSettings));
    saveStoredSettings(nextSettings);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  function restoreDefaults() {
    if (!window.confirm("Reset dashboard settings to the default layout?")) return;
    dispatch(resetSettings());
    saveStoredSettings(DEFAULT_SETTINGS);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  function toggleAllRecords() {
    setSelectedIds(selectedIds.length === records.length ? [] : records.map((record) => record.id));
  }

  function removeSelected() {
    if (!selectedIds.length || !window.confirm(`Delete ${selectedIds.length} selected record${selectedIds.length === 1 ? "" : "s"}? This cannot be undone.`)) return;
    selectedIds.forEach((id) => dispatch(deleteRecord(id)));
    setSelectedIds([]);
  }

  return (
    <ProtectedPage title="Dashboard settings" description="This area changes your workspace layout and can delete CRM records.">
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-water">Workspace configuration</p>
          <h1 className="text-xl font-display font-bold text-deep">Dashboard settings</h1>
          <p className="text-sm text-muted">Create, edit, update, or reset what your team sees.</p>
        </div>
        <Link href="/" className="btn-outline text-xs">Back to dashboard</Link>
      </div>

      <form onSubmit={saveSettings} className="panel p-4 flex flex-col gap-5">
        <div>
          <h2 className="font-display text-lg font-bold text-deep">Branding</h2>
          <p className="text-xs text-muted mt-1">This name appears in the top navigation and dashboard heading.</p>
          <label className="field-label mt-4" htmlFor="branding-name">Branding name</label>
          <input id="branding-name" className="field-input max-w-xl" value={brandingName} onChange={(event) => setBrandingName(event.target.value)} maxLength={80} required />
        </div>

        <div>
          <h2 className="font-display text-lg font-bold text-deep">Dashboard visibility</h2>
          <p className="text-xs text-muted mt-1">Select the cards and sections that should show on the dashboard.</p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {DASHBOARD_WIDGETS.map((widget) => (
              <label key={widget} className="flex items-center gap-3 rounded-md border border-line bg-panel px-3 py-3 text-sm text-deep cursor-pointer">
                <input type="checkbox" checked={dashboardWidgets.includes(widget)} onChange={() => toggleWidget(widget)} />
                <span>{WIDGET_LABELS[widget]}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg font-bold text-deep">Management dashboard</h2>
          <p className="text-xs text-muted mt-1">Choose the detail panels and table columns shown in the management dashboard.</p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {MANAGEMENT_PANELS.map((panel) => <label key={panel} className="flex items-center gap-3 rounded-md border border-line bg-panel px-3 py-3 text-sm text-deep cursor-pointer"><input type="checkbox" checked={managementPanels.includes(panel)} onChange={() => toggleSetting(panel, setManagementPanels)} /><span>{PANEL_LABELS[panel]}</span></label>)}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {OPERATIONS_COLUMNS.map((column) => <label key={column} className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-xs text-deep cursor-pointer"><input type="checkbox" checked={operationsColumns.includes(column)} onChange={() => toggleSetting(column, setOperationsColumns)} /><span>{COLUMN_LABELS[column]}</span></label>)}
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg font-bold text-deep">Request status filters</h2>
          <p className="text-xs text-muted mt-1">Choose which statuses appear in the Request status chart and Operations matrix.</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ALL_JOB_STATUSES.map((status) => <label key={status} className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-xs text-deep cursor-pointer"><input type="checkbox" checked={visibleStatuses.includes(status)} onChange={() => toggleSetting(status, setVisibleStatuses)} /><span>{STATUS_LABELS[status]}</span></label>)}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <button type="submit" className="btn-primary">{saved ? "Updated" : "Save settings"}</button>
          <button type="button" className="btn-outline" onClick={restoreDefaults}>Reset settings</button>
        </div>
      </form>

      <section className="panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-display text-lg font-bold text-deep">Data safety and synchronization</h2><p className="mt-1 text-xs text-muted">Back up local data before importing. Google credentials remain on the server.</p></div>
          <div className="flex flex-wrap gap-2"><button type="button" className="btn-outline text-xs" onClick={downloadBackup}>Download backup</button><label className="btn-outline text-xs cursor-pointer">Import backup<input type="file" accept="application/json,.json" className="hidden" onChange={importBackup} /></label><button type="button" className="btn-primary text-xs" onClick={syncNow} disabled={syncStatus === "syncing"}>{syncStatus === "syncing" ? "Syncing..." : "Sync Now"}</button></div>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted"><span>Sync: {syncStatus === "success" ? "Completed" : syncStatus === "failed" ? "Failed" : syncStatus === "syncing" ? "In progress" : "Ready"}</span>{lastSync && <span>Last successful sync: {lastSync}</span>}{backupMessage && <span className="font-semibold text-deep">{backupMessage}</span>}</div>
      </section>

      <section className="panel p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-deep">Data management</h2>
            <p className="text-xs text-muted mt-1">Select one row or several rows to permanently delete them.</p>
          </div>
          <button type="button" className="btn-outline text-xs" onClick={removeSelected} disabled={!selectedIds.length}>Delete selected ({selectedIds.length})</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-xs">
            <thead>
              <tr className="border-b border-line text-left uppercase tracking-wide text-muted">
                <th className="px-2 py-2"><input type="checkbox" aria-label="Select all records" checked={records.length > 0 && selectedIds.length === records.length} onChange={toggleAllRecords} /></th>
                <th className="px-2 py-2">Customer</th>
                <th className="px-2 py-2">Service</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b border-panel">
                  <td className="px-2 py-3"><input type="checkbox" aria-label={`Select ${record.customer.name || "unnamed record"}`} checked={selectedIds.includes(record.id)} onChange={() => setSelectedIds((current) => current.includes(record.id) ? current.filter((id) => id !== record.id) : [...current, record.id])} /></td>
                  <td className="px-2 py-3 font-semibold text-deep">{record.customer.name || "Unnamed customer"}</td>
                  <td className="px-2 py-3 capitalize">{record.service}</td>
                  <td className="px-2 py-3 capitalize">{record.status.replaceAll("_", " ")}</td>
                  <td className="px-2 py-3 text-muted">{new Date(record.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {!records.length && <tr><td colSpan={5} className="px-2 py-8 text-center text-muted">No records to manage.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
    </ProtectedPage>
  );
}