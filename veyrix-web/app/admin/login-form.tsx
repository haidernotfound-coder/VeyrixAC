"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Incorrect password");
        setLoading(false);
        return;
      }
      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Network error, try again");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-sm border border-panel-line bg-panel p-6"
    >
      <label className="block text-sm text-paper-dim">Password</label>
      <input
        type="password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="font-mono-data mt-2 w-full rounded-sm border border-panel-line bg-ink px-3 py-2.5 text-paper outline-none focus:border-signal"
        placeholder="••••••••••"
      />
      {error && <p className="mt-3 text-sm text-alert">{error}</p>}
      <button
        type="submit"
        disabled={loading || !password}
        className="mt-5 w-full rounded-sm bg-signal py-2.5 font-medium text-ink transition-opacity disabled:opacity-40"
      >
        {loading ? "Checking..." : "Sign in"}
      </button>
    </form>
  );
}
