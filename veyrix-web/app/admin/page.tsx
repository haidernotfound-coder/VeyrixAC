import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/auth";
import LoginForm from "./login-form";

export default async function AdminEntry() {
  if (await isAdminAuthed()) {
    redirect("/admin/dashboard");
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="font-mono-data text-xs uppercase tracking-wide text-signal-dim">
            Veyrix
          </div>
          <h1 className="mt-2 text-2xl font-medium text-paper">Admin access</h1>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
