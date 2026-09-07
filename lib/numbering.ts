import { ServiceKey } from "./types";
import { SERVICES } from "./services";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function dateStamp(d: Date = new Date()): string {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
}

// e.g. waterproofing + invoice -> "WI", painting + quotation -> "PQ"
export function counterKey(service: ServiceKey, docType: "invoice" | "quotation"): string {
  const letter = SERVICES[service].numberPrefix;
  return `${letter}${docType === "invoice" ? "I" : "Q"}`;
}

// Builds the human-facing number from a prefix key, date stamp and sequence number.
// e.g. counterKey + dateStamp + seq -> "WQ202608181"
export function buildNumber(key: string, stamp: string, seq: number): string {
  return `${key}${stamp}${seq}`;
}
