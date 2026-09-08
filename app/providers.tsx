"use client";

import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { hydrate } from "@/lib/recordsSlice";
import { loadStoredRecords, loadStoredSettings, makeStore, AppStore } from "@/lib/store";
import { updateSettings } from "@/lib/settingsSlice";
import ProtectedPage from "@/components/ProtectedPage";

export default function Providers({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  useEffect(() => {
    const storedRecords = loadStoredRecords();
    if (storedRecords) {
      storeRef.current?.dispatch(hydrate(storedRecords));
    }
    const storedSettings = loadStoredSettings();
    if (storedSettings) {
      storeRef.current?.dispatch(updateSettings(storedSettings));
    }
  }, []);

  return (
    <Provider store={storeRef.current}>
      <ProtectedPage title="Secure workspace" description="Enter today's access code to open the CRM workspace.">
        {children}
      </ProtectedPage>
    </Provider>
  );
}
