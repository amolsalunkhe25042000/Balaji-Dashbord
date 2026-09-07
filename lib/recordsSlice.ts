import { createSlice, PayloadAction, ThunkAction, AnyAction } from "@reduxjs/toolkit";
import { JobRecord, JobStatus, LineItem, Payment, ServiceKey } from "./types";
import { SERVICES } from "./services";
import { newId } from "./money";
import { counterKey, dateStamp } from "./numbering";
import type { RootState } from "./store";

type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, AnyAction>;

interface RecordsState {
  byId: Record<string, JobRecord>;
  allIds: string[];
  counters: Record<string, number>; // key: `${prefix}${stamp}` -> last used sequence
}

const initialState: RecordsState = {
  byId: {},
  allIds: [],
  counters: {},
};

export function makeBlankRecord(service: ServiceKey): JobRecord {
  const svc = SERVICES[service];
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();
  return {
    id: newId("job"),
    service,
    status: "enquiry",
    company: { ...svc.companyDefaults },
    customer: { name: "", address: "", contact: "", site: "" },
    items: svc.defaultItems.map((it) => ({ id: newId("item"), ...it })),
    discountPercent: 0,
    gstEnabled: false,
    gstPercent: 18,
    quotationNo: "",
    quotationDate: today,
    validityDays: 15,
    quotationPrinted: false,
    invoiceNo: "",
    invoiceDate: today,
    invoiceCreated: false,
    payments: [],
    warranty: svc.defaultWarranty,
    paymentTerms: svc.defaultPaymentTerms,
    terms: svc.defaultTerms.join("\n"),
    createdAt: now,
    updatedAt: now,
  };
}

const recordsSlice = createSlice({
  name: "records",
  initialState,
  reducers: {
    upsertRecord(state, action: PayloadAction<JobRecord>) {
      const rec = { ...action.payload, updatedAt: new Date().toISOString() };
      if (!state.byId[rec.id]) state.allIds.unshift(rec.id);
      state.byId[rec.id] = rec;
    },
    patchRecord(state, action: PayloadAction<{ id: string; patch: Partial<JobRecord> }>) {
      const rec = state.byId[action.payload.id];
      if (!rec) return;
      Object.assign(rec, action.payload.patch, { updatedAt: new Date().toISOString() });
    },
    setItems(state, action: PayloadAction<{ id: string; items: LineItem[] }>) {
      const rec = state.byId[action.payload.id];
      if (!rec) return;
      rec.items = action.payload.items;
      rec.updatedAt = new Date().toISOString();
    },
    addPayment(state, action: PayloadAction<{ id: string; payment: Payment }>) {
      const rec = state.byId[action.payload.id];
      if (!rec) return;
      rec.payments.push(action.payload.payment);
      rec.updatedAt = new Date().toISOString();
    },
    removePayment(state, action: PayloadAction<{ id: string; paymentId: string }>) {
      const rec = state.byId[action.payload.id];
      if (!rec) return;
      rec.payments = rec.payments.filter((p) => p.id !== action.payload.paymentId);
      rec.updatedAt = new Date().toISOString();
    },
    setStatus(state, action: PayloadAction<{ id: string; status: JobStatus }>) {
      const rec = state.byId[action.payload.id];
      if (!rec) return;
      rec.status = action.payload.status;
      rec.updatedAt = new Date().toISOString();
    },
    deleteRecord(state, action: PayloadAction<string>) {
      delete state.byId[action.payload];
      state.allIds = state.allIds.filter((id) => id !== action.payload);
    },
    // internal: bump and record the daily sequence counter for a given key+stamp
    _bumpCounter(state, action: PayloadAction<{ counterId: string; value: number }>) {
      state.counters[action.payload.counterId] = action.payload.value;
    },
    hydrate(_state, action: PayloadAction<RecordsState>) {
      return action.payload;
    },
  },
});

export const {
  upsertRecord,
  patchRecord,
  setItems,
  addPayment,
  removePayment,
  setStatus,
  deleteRecord,
  hydrate,
} = recordsSlice.actions;
const { _bumpCounter } = recordsSlice.actions;

export default recordsSlice.reducer;

// ---- Thunks for number generation (need read-then-write against current state) ----

// Suggests the next number without consuming it (safe to call repeatedly, e.g. for display).
export function peekNextNumber(service: ServiceKey, docType: "invoice" | "quotation"): AppThunk<string> {
  return (_dispatch, getState) => {
    const stamp = dateStamp();
    const key = counterKey(service, docType);
    const counterId = `${key}${stamp}`;
    const seq = (getState().records.counters[counterId] || 0) + 1;
    return `${key}${stamp}${seq}`;
  };
}

// Locks in and consumes the next number (call only when actually printing/finalising).
export function commitNextNumber(service: ServiceKey, docType: "invoice" | "quotation"): AppThunk<string> {
  return (dispatch, getState) => {
    const stamp = dateStamp();
    const key = counterKey(service, docType);
    const counterId = `${key}${stamp}`;
    const seq = (getState().records.counters[counterId] || 0) + 1;
    dispatch(_bumpCounter({ counterId, value: seq }));
    return `${key}${stamp}${seq}`;
  };
}

// ---- Selectors ----
export const selectAllRecords = (state: RootState): JobRecord[] =>
  state.records.allIds.map((id) => state.records.byId[id]);

export const selectRecordById = (state: RootState, id: string): JobRecord | undefined =>
  state.records.byId[id];
