import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/auth";
import Dashboard from "./dashboard-client";

export default async function DashboardPage() {
  if (!(await isAdminAuthed())) {
    redirect("/admin");
  }
  return <Dashboard />;
}
