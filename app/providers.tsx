"use client";

import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { hydrate } from "@/lib/recordsSlice";
import { loadStoredRecords, makeStore, AppStore } from "@/lib/store";

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
  }, []);

  return <Provider store={storeRef.current}>{children}</Provider>;
}
