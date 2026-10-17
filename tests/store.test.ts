import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LEGACY_SETTINGS_STORAGE_KEY,
  loadStoredSettings,
  SETTINGS_STORAGE_KEY,
} from "@/lib/store";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("loadStoredSettings legacy migration", () => {
  it("preserves only recognized old advanced settings under legacySettings", () => {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
      brandingName: "Balaji Paints",
      dashboardWidgets: ["managementDashboard"],
      managementPanels: ["serviceMix", "unknown"],
      visibleStatuses: ["enquiry", "not-a-status"],
    }));
    window.localStorage.setItem(LEGACY_SETTINGS_STORAGE_KEY, JSON.stringify({
      operationsColumns: ["requests", "not-a-column"],
    }));
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});

    const settings = loadStoredSettings();
    const legacy = JSON.parse(window.localStorage.getItem(LEGACY_SETTINGS_STORAGE_KEY) || "{}");

    expect(settings?.brandingName).toBe("Balaji Paints");
    expect(legacy).toEqual({
      managementPanels: ["serviceMix"],
      operationsColumns: ["requests"],
      visibleStatuses: ["enquiry"],
    });
    expect(warning).toHaveBeenCalledWith(
      "Your old advanced settings were preserved under 'legacySettings'.",
    );
  });
});
