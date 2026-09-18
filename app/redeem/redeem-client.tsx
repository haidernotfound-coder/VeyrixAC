"use client";

import { useState } from "react";

interface VersionRow {
  id: string;
  version_label: string;
  mc_version: string;
  filename: string;
  file_size_bytes: number;
  notes: string | null;
  is_latest: boolean;
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function RedeemClient() {
  const [pin, setPin] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<VersionRow[] | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleCheckPin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setVersions(null);
    if (!/^\d{6}$/.test(pin)) {
      setError("PIN must be exactly 6 digits");
      return;
    }
    setChecking(true);
    try {
      const res = await fetch(`/api/redeem?pin=${encodeURIComponent(pin)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid PIN");
      } else {
        setVersions(data.versions);
      }
    } catch {
      setError("Network error, try again");
    } finally {
      setChecking(false);
    }
  }

  async function handleDownload(versionId: string) {
    setError(null);
    setDownloadingId(versionId);
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, versionId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Download failed - this PIN may already be used.");
        setDownloadingId(null);
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="(.+)"/);
      const filename = match?.[1] ?? "veyrix.jar";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setDone(true);
      setVersions(null);
    } catch {
      setError("Network error during download");
    } finally {
      setDownloadingId(null);
    }
  }

  if (done) {
    return (
      <div className="tick-frame glow-border rounded-sm border border-panel-line bg-panel p-6 text-center">
        <div className="text-signal">Download started.</div>
        <p className="mt-2 text-sm text-paper-dim">
          That PIN has now been used and won&apos;t work again. Drop the jar
          in your server&apos;s <span className="font-mono-data">/plugins</span>{" "}
          folder, restart, then run{" "}
          <span className="font-mono-data text-paper">/veyrix license &lt;key&gt;</span>.
        </p>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleCheckPin} className="flex gap-3">
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          placeholder="000000"
          autoFocus
          className="font-mono-data w-full rounded-sm border border-panel-line bg-panel px-4 py-3.5 text-center text-2xl tracking-[0.3em] text-paper outline-none transition-colors focus:border-signal"
        />
        <button
          type="submit"
          disabled={checking || pin.length !== 6}
          className="glow-btn shrink-0 rounded-sm bg-signal px-5 font-medium text-ink disabled:opacity-40"
        >
          {checking ? "..." : "Check"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-alert">{error}</p>}

      {versions && (
        <div className="mt-6">
          <p className="mb-3 text-xs text-paper-dim">Choose a build to download:</p>
          <div className="space-y-2">
            {versions.length === 0 && (
              <p className="rounded-sm border border-panel-line bg-panel p-4 text-sm text-paper-dim">
                No builds have been published yet - check back soon.
              </p>
            )}
            {versions.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between gap-4 rounded-sm border border-panel-line bg-panel p-4 transition-colors hover:border-signal-dim"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-data text-paper">{v.version_label}</span>
                    {v.is_latest && (
                      <span className="font-mono-data rounded-sm bg-signal-dim/20 px-2 py-0.5 text-xs text-signal">
                        latest
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-paper-dim">
                    MC {v.mc_version} · {formatBytes(v.file_size_bytes)}
                    {v.notes ? ` · ${v.notes}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(v.id)}
                  disabled={downloadingId !== null}
                  className="glow-btn shrink-0 rounded-sm bg-signal px-4 py-2 text-sm font-medium text-ink disabled:opacity-40"
                >
                  {downloadingId === v.id ? "Downloading..." : "Download"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
