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

interface VersionRow {
  id: string;
  version_label: string;
  mc_version: string;
  filename: string;
  file_size_bytes: number;
  notes: string | null;
  is_latest: boolean;
  uploaded_at: string;
  download_count: number;
}

interface PinRow {
  id: string;
  pin: string;
  label: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  revoked: boolean;
  used_version_label: string | null;
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

  const [versions, setVersions] = useState<VersionRow[] | null>(null);
  const [versionLabel, setVersionLabel] = useState("");
  const [mcVersion, setMcVersion] = useState("1.21.11");
  const [versionNotes, setVersionNotes] = useState("");
  const [setLatestOnUpload, setSetLatestOnUpload] = useState(true);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [versionError, setVersionError] = useState<string | null>(null);

  const [pins, setPins] = useState<PinRow[] | null>(null);
  const [pinLabel, setPinLabel] = useState("");
  const [generatingPin, setGeneratingPin] = useState(false);
  const [freshPin, setFreshPin] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  const router = useRouter();

  const load = useCallback(async () => {
    const [statsRes, keysRes, versionsRes, pinsRes] = await Promise.all([
      fetch("/api/admin/stats"),
      fetch("/api/admin/keys"),
      fetch("/api/admin/versions"),
      fetch("/api/admin/pins"),
    ]);
    if (
      statsRes.status === 401 ||
      keysRes.status === 401 ||
      versionsRes.status === 401 ||
      pinsRes.status === 401
    ) {
      router.push("/admin");
      return;
    }
    setStats(await statsRes.json());
    const keysData = await keysRes.json();
    setKeys(keysData.keys);
    const versionsData = await versionsRes.json();
    setVersions(versionsData.versions);
    const pinsData = await pinsRes.json();
    setPins(pinsData.pins);
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

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1] ?? "");
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }

  async function handleUploadVersion(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) {
      setVersionError("Choose a .jar file first");
      return;
    }
    setUploading(true);
    setVersionError(null);
    try {
      const fileBase64 = await fileToBase64(uploadFile);
      const res = await fetch("/api/admin/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionLabel,
          mcVersion,
          filename: uploadFile.name,
          fileBase64,
          notes: versionNotes || undefined,
          setLatest: setLatestOnUpload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVersionError(data.error ?? "Upload failed");
      } else {
        setVersionLabel("");
        setVersionNotes("");
        setUploadFile(null);
        load();
      }
    } catch {
      setVersionError("Network error");
    } finally {
      setUploading(false);
    }
  }

  async function handleSetLatest(versionId: string) {
    setVersionError(null);
    const res = await fetch(`/api/admin/versions/${versionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setLatest: true }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setVersionError(data.error ?? "Failed to update build");
      return;
    }
    load();
  }

  async function handleDeleteVersion(versionId: string) {
    if (!confirm("Permanently delete this build? Existing keys pointed at it by ID will stop working.")) return;
    setVersionError(null);
    const res = await fetch(`/api/admin/versions/${versionId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setVersionError(data.error ?? "Failed to delete build");
      return;
    }
    load();
  }

  function formatBytes(n: number) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  }

  async function handleGeneratePin(e: React.FormEvent) {
    e.preventDefault();
    setGeneratingPin(true);
    setPinError(null);
    setFreshPin(null);
    try {
      const res = await fetch("/api/admin/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: pinLabel || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPinError(data.error ?? "Failed to generate PIN");
      } else {
        setFreshPin(data.pin.pin);
        setPinLabel("");
        load();
      }
    } catch {
      setPinError("Network error");
    } finally {
      setGeneratingPin(false);
    }
  }

  async function handleRevokePin(pinId: string) {
    await fetch(`/api/admin/pins/${pinId}`, { method: "DELETE" });
    load();
  }

  function pinStatus(p: PinRow): "used" | "revoked" | "expired" | "active" {
    if (p.used_at) return "used";
    if (p.revoked) return "revoked";
    if (new Date(p.expires_at).getTime() < Date.now()) return "expired";
    return "active";
  }

  function timeUntil(iso: string) {
    const secs = Math.floor((new Date(iso).getTime() - Date.now()) / 1000);
    if (secs <= 0) return "expired";
    if (secs < 3600) return `${Math.floor(secs / 60)}m left`;
    return `${Math.floor(secs / 3600)}h left`;
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

        {/* Plugin versions / downloads */}
        <div className="mt-10 rounded-sm border border-panel-line bg-panel p-6">
          <h2 className="mb-1 font-medium">Plugin builds</h2>
          <p className="mb-4 text-xs text-paper-dim">
            Upload a jar here and mark it latest — <span className="font-mono-data">/api/download?key=&lt;key&gt;</span>{" "}
            always serves whichever build is marked latest below.
          </p>
          <form onSubmit={handleUploadVersion} className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs text-paper-dim">Version label</label>
              <input
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
                placeholder="e.g. 1.4.0"
                required
                className="font-mono-data mt-1.5 w-32 rounded-sm border border-panel-line bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-signal"
              />
            </div>
            <div>
              <label className="block text-xs text-paper-dim">MC version</label>
              <input
                value={mcVersion}
                onChange={(e) => setMcVersion(e.target.value)}
                placeholder="1.21.11"
                className="font-mono-data mt-1.5 w-28 rounded-sm border border-panel-line bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-signal"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-paper-dim">Notes (optional)</label>
              <input
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                placeholder="e.g. fixes NoSlow vehicle exemption"
                className="font-mono-data mt-1.5 w-full rounded-sm border border-panel-line bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-signal"
              />
            </div>
            <div>
              <label className="block text-xs text-paper-dim">Jar file</label>
              <input
                type="file"
                accept=".jar"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                className="font-mono-data mt-1.5 max-w-[220px] text-xs text-paper-dim"
              />
            </div>
            <label className="flex items-center gap-2 pb-2 text-xs text-paper-dim">
              <input
                type="checkbox"
                checked={setLatestOnUpload}
                onChange={(e) => setSetLatestOnUpload(e.target.checked)}
                className="accent-signal"
              />
              Mark as latest
            </label>
            <button
              type="submit"
              disabled={uploading}
              className="glow-btn rounded-sm bg-signal px-5 py-2 font-medium text-ink disabled:opacity-40"
            >
              {uploading ? "Uploading..." : "Upload build"}
            </button>
          </form>
          {versionError && <p className="mt-3 text-sm text-alert">{versionError}</p>}

          <div className="mt-6 overflow-x-auto rounded-sm border border-panel-line">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-panel-line text-xs text-paper-dim">
                  <th className="px-6 py-3 font-normal">Version</th>
                  <th className="px-6 py-3 font-normal">MC target</th>
                  <th className="px-6 py-3 font-normal">File</th>
                  <th className="px-6 py-3 font-normal">Size</th>
                  <th className="px-6 py-3 font-normal">Downloads</th>
                  <th className="px-6 py-3 font-normal">Uploaded</th>
                  <th className="px-6 py-3 font-normal">Status</th>
                  <th className="px-6 py-3 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {versions === null && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-paper-dim">
                      Loading...
                    </td>
                  </tr>
                )}
                {versions?.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-paper-dim">
                      No builds uploaded yet.
                    </td>
                  </tr>
                )}
                {versions?.map((v) => (
                  <tr key={v.id} className="border-b border-panel-line last:border-0">
                    <td className="font-mono-data px-6 py-4 text-paper">{v.version_label}</td>
                    <td className="px-6 py-4 text-paper-dim">{v.mc_version}</td>
                    <td className="font-mono-data px-6 py-4 text-xs text-paper-dim">{v.filename}</td>
                    <td className="px-6 py-4 text-paper-dim">{formatBytes(v.file_size_bytes)}</td>
                    <td className="px-6 py-4 text-paper-dim">{v.download_count}</td>
                    <td className="px-6 py-4 text-paper-dim">
                      {new Date(v.uploaded_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {v.is_latest ? (
                        <span className="font-mono-data rounded-sm bg-signal-dim/20 px-2 py-0.5 text-xs text-signal">
                          latest
                        </span>
                      ) : (
                        <span className="font-mono-data rounded-sm bg-paper-dim/10 px-2 py-0.5 text-xs text-paper-dim">
                          archived
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        {!v.is_latest && (
                          <button
                            onClick={() => handleSetLatest(v.id)}
                            className="text-xs text-paper-dim hover:text-signal transition-colors"
                          >
                            Make latest
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteVersion(v.id)}
                          className="text-xs text-paper-dim hover:text-alert transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Download PINs */}
        <div className="mt-10 rounded-sm border border-panel-line bg-panel p-6">
          <h2 className="mb-1 font-medium">Download PINs</h2>
          <p className="mb-4 text-xs text-paper-dim">
            Give a player a 6-digit code. They enter it at{" "}
            <span className="font-mono-data">/redeem</span>, pick a build,
            and it downloads once — the code is burned after use.
          </p>
          <form onSubmit={handleGeneratePin} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-paper-dim">Label (optional)</label>
              <input
                value={pinLabel}
                onChange={(e) => setPinLabel(e.target.value)}
                placeholder="e.g. buyer's Discord handle"
                className="font-mono-data mt-1.5 w-full rounded-sm border border-panel-line bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-signal"
              />
            </div>
            <button
              type="submit"
              disabled={generatingPin}
              className="glow-btn rounded-sm bg-signal px-5 py-2 font-medium text-ink disabled:opacity-40"
            >
              {generatingPin ? "Generating..." : "Generate PIN"}
            </button>
          </form>
          {pinError && <p className="mt-3 text-sm text-alert">{pinError}</p>}
          {freshPin && (
            <div className="glow-border mt-4 rounded-sm border border-signal-dim bg-ink p-4">
              <div className="text-xs text-paper-dim">New PIN (valid 24h, give it to the player):</div>
              <div className="font-mono-data mt-1 text-2xl tracking-[0.3em] text-signal">{freshPin}</div>
            </div>
          )}

          <div className="mt-6 overflow-x-auto rounded-sm border border-panel-line">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-panel-line text-xs text-paper-dim">
                  <th className="px-6 py-3 font-normal">PIN</th>
                  <th className="px-6 py-3 font-normal">Label</th>
                  <th className="px-6 py-3 font-normal">Used build</th>
                  <th className="px-6 py-3 font-normal">Expires</th>
                  <th className="px-6 py-3 font-normal">Status</th>
                  <th className="px-6 py-3 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {pins === null && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-paper-dim">
                      Loading...
                    </td>
                  </tr>
                )}
                {pins?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-paper-dim">
                      No PINs generated yet.
                    </td>
                  </tr>
                )}
                {pins?.map((p) => {
                  const status = pinStatus(p);
                  return (
                    <tr key={p.id} className="border-b border-panel-line last:border-0">
                      <td className="font-mono-data px-6 py-4 tracking-[0.2em] text-paper">{p.pin}</td>
                      <td className="px-6 py-4 text-paper-dim">{p.label || <span>—</span>}</td>
                      <td className="px-6 py-4 text-paper-dim">
                        {p.used_version_label || <span>—</span>}
                      </td>
                      <td className="px-6 py-4 text-paper-dim">
                        {status === "active" ? timeUntil(p.expires_at) : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-mono-data rounded-sm px-2 py-0.5 text-xs ${
                            status === "active"
                              ? "bg-signal-dim/20 text-signal"
                              : status === "used"
                              ? "bg-paper-dim/10 text-paper-dim"
                              : "bg-alert/10 text-alert"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {status === "active" && (
                          <button
                            onClick={() => handleRevokePin(p.id)}
                            className="text-xs text-paper-dim hover:text-alert transition-colors"
                          >
                            Revoke
                          </button>
                        )}
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
