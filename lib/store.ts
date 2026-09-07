import { configureStore } from "@reduxjs/toolkit";
import recordsReducer from "./recordsSlice";

const STORAGE_KEY = "balaji_crm_state_v1";

function loadPreloadedState() {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return { records: parsed };
  } catch {
    return undefined;
  }
}

export function makeStore() {
  const store = configureStore({
    reducer: { records: recordsReducer },
    preloadedState: loadPreloadedState(),
  });

  if (typeof window !== "undefined") {
    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    store.subscribe(() => {
      if (saveTimer) clearTimeout(saveTimer);
      // debounce so rapid typing doesn't hammer localStorage
      saveTimer = setTimeout(() => {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store.getState().records));
        } catch {
          /* ignore quota / private-browsing errors */
        }
      }, 250);
    });
  }

  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
