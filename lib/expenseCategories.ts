import { ExpenseCategory } from "./types";

export const JOB_EXPENSE_CATEGORIES: ExpenseCategory[] = ["labor", "material", "transport", "equipment", "subcontractor", "food_travel", "other"];

export const JOB_EXPENSE_LABELS: Record<ExpenseCategory, string> = {
  labor: "Labor charges",
  material: "Materials",
  transport: "Transportation / travel",
  equipment: "Equipment",
  subcontractor: "Subcontractor",
  food_travel: "Food / travel",
  other: "Other",
};

export const JOB_EXPENSE_COLORS: Record<ExpenseCategory, string> = {
  labor: "#D9622B",
  material: "#0F8B8D",
  transport: "#2563EB",
  equipment: "#B7791F",
  subcontractor: "#0E7490",
  food_travel: "#BE185D",
  other: "#7C3AED",
};

export const BUSINESS_EXPENSE_CATEGORIES = ["Office rent", "Electricity", "Internet", "Software", "Marketing", "Salary", "Maintenance", "Other"];
