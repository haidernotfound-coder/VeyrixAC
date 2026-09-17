import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { sql, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB, plenty for a plugin jar

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureSchema();
  const db = sql();
  const versions = await db`
    SELECT id, version_label, mc_version, filename, file_size_bytes, notes,
           is_latest, uploaded_at, download_count
    FROM plugin_versions
    ORDER BY uploaded_at DESC
  `;
  return NextResponse.json({ versions });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { versionLabel, mcVersion, filename, fileBase64, notes, setLatest } = await req.json();

    if (typeof versionLabel !== "string" || !versionLabel.trim()) {
      return NextResponse.json({ error: "versionLabel is required" }, { status: 400 });
    }
    if (typeof filename !== "string" || !filename.trim()) {
      return NextResponse.json({ error: "filename is required" }, { status: 400 });
    }
    if (typeof fileBase64 !== "string" || !fileBase64) {
      return NextResponse.json({ error: "fileBase64 is required" }, { status: 400 });
    }

    const sizeBytes = Math.floor((fileBase64.length * 3) / 4);
    if (sizeBytes > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "File too large (15 MB max)" }, { status: 400 });
    }

    await ensureSchema();
    const db = sql();

    if (setLatest) {
      await db`UPDATE plugin_versions SET is_latest = false`;
    }

    const [row] = await db`
      INSERT INTO plugin_versions (version_label, mc_version, filename, file_bytes, file_size_bytes, notes, is_latest)
      VALUES (
        ${versionLabel.trim()},
        ${mcVersion?.trim() || "1.21.11"},
        ${filename.trim()},
        ${fileBase64},
        ${sizeBytes},
        ${notes ?? null},
        ${!!setLatest}
      )
      RETURNING id, version_label, mc_version, filename, file_size_bytes, notes, is_latest, uploaded_at
    `;

    return NextResponse.json({ version: row });
  } catch (err: unknown) {
    console.error("upload version error", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
