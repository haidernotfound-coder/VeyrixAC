"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface KeyRow {
  key_id: string;
  key_string: string;
  label: string | null;
  expiry_epoch_seconds: number;
  created_at: string;
  revoked: boolean;
  revoked_at: string | null;
  install_count: number;
  last_seen: string | null;
}

interface Stats {
  total_keys: number;
  active_keys: number;
  total_installs: number;
  active_installs: number;
}

function formatExpiry(epoch: number) {
  if (epoch < 0) return "Permanent";
  return new Date(epoch * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isExpired(epoch: number) {
  return epoch >= 0 && Date.now() / 1000 > epoch;
}

function timeAgo(iso: string | null) {
  if (!iso) return "never";
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [keys, setKeys] = useState<KeyRow[] | null>(null);
  const [duration, setDuration] = useState("30d");
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    const [statsRes, keysRes] = await Promise.all([
      fetch("/api/admin/stats"),
      fetch("/api/admin/keys"),
    ]);
    if (statsRes.status === 401 || keysRes.status === 401) {
      router.push("/admin");
      return;
    }
    setStats(await statsRes.json());
    const keysData = await keysRes.json();
    setKeys(keysData.keys);
  }, [router]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setNewKey(null);
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration, label: label || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create key");
      } else {
        setNewKey(data.key.keyString);
        setLabel("");
        load();
      }
    } catch {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(keyId: string, revoked: boolean) {
    await fetch(`/api/admin/keys/${keyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revoked }),
    });
    load();
  }

  async function handleDelete(keyId: string) {
    if (!confirm("Permanently delete this key and its install history? This can't be undone.")) return;
    await fetch(`/api/admin/keys/${keyId}`, { method: "DELETE" });
    load();
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 text-paper">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <div className="font-mono-data text-xs uppercase tracking-wide text-signal-dim">Veyrix</div>
            <h1 className="mt-1 text-2xl font-medium">License admin</h1>
          </div>
          <button
            onClick={handleLogout}
            className="font-mono-data text-sm text-paper-dim hover:text-alert transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Stats */}
        <div className="mb-10 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-panel-line bg-panel-line sm:grid-cols-4">
          {[
            ["Total keys", stats?.total_keys],
            ["Active keys", stats?.active_keys],
            ["Total installs", stats?.total_installs],
            ["Active now (30m)", stats?.active_installs],
          ].map(([label, val]) => (
            <div key={label as string} className="bg-panel p-5">
              <div className="font-mono-data text-2xl text-signal">
                {val === undefined || val === null ? "—" : val}
              </div>
              <div className="mt-1 text-xs text-paper-dim">{label}</div>
            </div>
          ))}
        </div>

        {/* Create key */}
        <div className="mb-10 rounded-sm border border-panel-line bg-panel p-6">
          <h2 className="mb-4 font-medium">Generate a license key</h2>
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs text-paper-dim">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="font-mono-data mt-1.5 rounded-sm border border-panel-line bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-signal"
              >
                <option value="30d">30 days</option>
                <option value="90d">90 days</option>
                <option value="6mo">6 months</option>
                <option value="1y">1 year</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-paper-dim">Label (optional)</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. buyer's Discord handle"
                className="font-mono-data mt-1.5 w-full rounded-sm border border-panel-line bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-signal"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="rounded-sm bg-signal px-5 py-2 font-medium text-ink disabled:opacity-40"
            >
              {creating ? "Generating..." : "Generate key"}
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-alert">{error}</p>}
          {newKey && (
            <div className="mt-4 rounded-sm border border-signal-dim bg-ink p-4">
              <div className="text-xs text-paper-dim">New key (copy it now):</div>
              <div className="font-mono-data mt-1 break-all text-sm text-signal">{newKey}</div>
            </div>
          )}
        </div>

        {/* Keys table */}
        <div className="rounded-sm border border-panel-line bg-panel">
          <div className="border-b border-panel-line p-6">
            <h2 className="font-medium">License keys</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-panel-line text-xs text-paper-dim">
                  <th className="px-6 py-3 font-normal">Label</th>
                  <th className="px-6 py-3 font-normal">Key</th>
                  <th className="px-6 py-3 font-normal">Expiry</th>
                  <th className="px-6 py-3 font-normal">Installs</th>
                  <th className="px-6 py-3 font-normal">Last seen</th>
                  <th className="px-6 py-3 font-normal">Status</th>
                  <th className="px-6 py-3 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {keys === null && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-paper-dim">
                      Loading...
                    </td>
                  </tr>
                )}
                {keys?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-paper-dim">
                      No keys yet — generate one above.
                    </td>
                  </tr>
                )}
                {keys?.map((k) => {
                  const expired = isExpired(k.expiry_epoch_seconds);
                  const status = k.revoked ? "revoked" : expired ? "expired" : "active";
                  return (
                    <tr key={k.key_id} className="border-b border-panel-line last:border-0">
                      <td className="px-6 py-4 text-paper">{k.label || <span className="text-paper-dim">—</span>}</td>
                      <td className="font-mono-data px-6 py-4 text-xs text-paper-dim">
                        {k.key_string.slice(0, 18)}...
                      </td>
                      <td className="px-6 py-4 text-paper-dim">{formatExpiry(k.expiry_epoch_seconds)}</td>
                      <td className="px-6 py-4 text-paper-dim">{k.install_count}</td>
                      <td className="px-6 py-4 text-paper-dim">{timeAgo(k.last_seen)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-mono-data rounded-sm px-2 py-0.5 text-xs ${
                            status === "active"
                              ? "bg-signal-dim/20 text-signal"
                              : status === "expired"
                              ? "bg-paper-dim/10 text-paper-dim"
                              : "bg-alert/10 text-alert"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleRevoke(k.key_id, !k.revoked)}
                            className="text-xs text-paper-dim hover:text-paper transition-colors"
                          >
                            {k.revoked ? "Unrevoke" : "Revoke"}
                          </button>
                          <button
                            onClick={() => handleDelete(k.key_id)}
                            className="text-xs text-paper-dim hover:text-alert transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
