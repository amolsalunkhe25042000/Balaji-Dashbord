import { redirect } from "next/navigation";

export default function ReportsPage() {
  redirect("/owner?view=reports");
}
