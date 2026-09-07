import { CompanyInfo, ServiceKey } from "./types";

export interface PresetItem {
  description: string;
  unit: string;
}

export interface ServiceConfig {
  key: ServiceKey;
  label: string;
  numberPrefix: "P" | "W";
  accent: string; // tailwind color token used as bg/text
  accentHex: string;
  logo: "drop" | "roller";
  companyDefaults: CompanyInfo;
  presets: PresetItem[];
  defaultItems: { description: string; unit: string; qty: number; rate: number }[];
  defaultWarranty: string;
  defaultPaymentTerms: string;
  defaultTerms: string[];
  scopeLabel: string;
  descPlaceholder: string;
}

export const SERVICES: Record<ServiceKey, ServiceConfig> = {
  waterproofing: {
    key: "waterproofing",
    label: "Waterproofing",
    numberPrefix: "W",
    accent: "water",
    accentHex: "#0F8B8D",
    logo: "drop",
    companyDefaults: {
      name: "Balaji Waterproofing Specialists",
      tagline: "Terrace | Bathroom | Basement | Tank | Leakage solutions",
      address: "Shop No. 4, Kalewadi Phata Road, Pimple Saudagar, Pune, Maharashtra 411027",
      phone1: "9356535803",
      phone2: "8805218402",
      email: "balajiwaterproofing@gmail.com",
      website: "www.balajiwaterproofing.com",
      gstin: "",
    },
    presets: [
      { description: "Terrace waterproofing – APP membrane (torching)", unit: "Sq.ft" },
      { description: "Terrace waterproofing – bituminous coating", unit: "Sq.ft" },
      { description: "Bathroom / toilet waterproofing", unit: "Sq.ft" },
      { description: "Water tank waterproofing (internal)", unit: "Sq.ft" },
      { description: "Wall crack filling and PU injection grouting", unit: "Rft" },
      { description: "External wall waterproof coating", unit: "Sq.ft" },
      { description: "Expansion joint treatment", unit: "Rft" },
      { description: "Chemical injection grouting (leakage point)", unit: "Point" },
      { description: "Epoxy grouting – floor / bathroom", unit: "Sq.ft" },
      { description: "Basement waterproofing", unit: "Sq.ft" },
    ],
    defaultItems: [
      { description: "Terrace waterproofing – APP membrane (torching)", unit: "Sq.ft", qty: 800, rate: 65 },
      { description: "Bathroom / toilet waterproofing", unit: "Sq.ft", qty: 45, rate: 90 },
    ],
    defaultWarranty: "5 years on terrace membrane work, 2 years on bathroom / wall waterproofing.",
    defaultPaymentTerms: "50% advance to start work, 40% on completion of waterproofing, 10% after 7-day water test.",
    defaultTerms: [
      "Rates are inclusive of material and labour unless mentioned otherwise.",
      "Any additional work outside this scope will be charged separately.",
      "Client to provide water and electricity connection at site.",
      "Scaffolding, if required, will be charged extra.",
      "Work will commence within 3 days of advance payment.",
    ],
    scopeLabel: "Scope of work and pricing",
    descPlaceholder: "Describe the waterproofing work",
  },
  painting: {
    key: "painting",
    label: "Painting",
    numberPrefix: "P",
    accent: "paint",
    accentHex: "#D9622B",
    logo: "roller",
    companyDefaults: {
      name: "Balaji Painting Service",
      tagline: "Interior | Exterior | Texture | Wood & Metal finishes",
      address: "Shop No. 4, Kalewadi Phata Road, Pimple Saudagar, Pune, Maharashtra 411027",
      phone1: "9356535803",
      phone2: "8805218402",
      email: "balajipaintservice@gmail.com",
      website: "balajiwaterproofing.vercel.app/",
      gstin: "",
    },
    presets: [
      { description: "Interior wall painting – 2 coats emulsion", unit: "Sq.ft" },
      { description: "Exterior wall painting – weatherproof emulsion", unit: "Sq.ft" },
      { description: "Putty and primer application", unit: "Sq.ft" },
      { description: "Wood polish / French polish", unit: "Sq.ft" },
      { description: "Metal grill / gate enamel painting", unit: "Sq.ft" },
      { description: "Texture / stone coat wall finish", unit: "Sq.ft" },
      { description: "Ceiling painting", unit: "Sq.ft" },
      { description: "Waterproof exterior painting (elastomeric)", unit: "Sq.ft" },
      { description: "Wall crack filling and POP punning", unit: "Sq.ft" },
      { description: "Door / window frame painting", unit: "Nos" },
    ],
    defaultItems: [
      { description: "Interior wall painting – 2 coats emulsion", unit: "Sq.ft", qty: 1200, rate: 18 },
      { description: "Exterior wall painting – weatherproof emulsion", unit: "Sq.ft", qty: 600, rate: 24 },
    ],
    defaultWarranty:
      "5-year warranty for painting workmanship. The warranty does not cover wall cracks, water leakage, seepage, dampness, structural damage, or damage caused by external factors.",
    defaultPaymentTerms: "40% advance at booking, 40% when 90% of the work is completed, and the remaining 20% after final completion.",
    defaultTerms: [
      "Timely Delivery: We complete the work on the agreed schedule. If the delay is due to our fault, no extra labor charges will be applied.",
      "No Hidden Charges: The quoted price is fixed. Any additional work requested by the customer will be charged only after prior approval.",
    ],
    scopeLabel: "Scope of painting work and pricing",
    descPlaceholder: "Describe the painting work",
  },
};

export const UNITS = ["Sq.ft", "Sq.m", "Rft", "Nos", "Point", "Ltr", "Kg", "Lumpsum"];
export const GST_RATES = [0, 5, 12, 18];
export const PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer", "Cheque", "Card"];
