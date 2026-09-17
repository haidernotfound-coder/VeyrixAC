import { NextRequest, NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

function isSixDigits(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

async function loadActivePin(db: ReturnType<typeof sql>, pin: string) {
  const [row] = await db`
    SELECT id, pin, used_at, revoked, expires_at
    FROM download_pins
    WHERE pin = ${pin}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (!row) return { row: null, reason: "PIN not found" as const };
  if (row.revoked) return { row: null, reason: "PIN has been revoked" as const };
  if (row.used_at) return { row: null, reason: "PIN has already been used" as const };
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { row: null, reason: "PIN has expired" as const };
  }
  return { row, reason: null };
}

/**
 * GET /api/redeem?pin=123456
 *
 * Step 1 of the flow: check the pin is live, and if so hand back the list
 * of jars the player can choose from. Does NOT consume the pin - that only
 * happens once they actually pick a version and download it (POST below).
 */
export async function GET(req: NextRequest) {
  const pin = (req.nextUrl.searchParams.get("pin") || "").trim();
  if (!isSixDigits(pin)) {
    return NextResponse.json({ error: "Enter a 6-digit PIN" }, { status: 400 });
  }

  await ensureSchema();
  const db = sql();
  const { row, reason } = await loadActivePin(db, pin);
  if (!row) {
    return NextResponse.json({ error: reason }, { status: 403 });
  }

  const versions = await db`
    SELECT id, version_label, mc_version, filename, file_size_bytes, notes, is_latest, uploaded_at
    FROM plugin_versions
    ORDER BY is_latest DESC, uploaded_at DESC
  `;

  return NextResponse.json({ ok: true, versions });
}

/**
 * POST /api/redeem  { pin, versionId }
 *
 * Step 2: burns the pin (one-time use) and streams back the chosen jar.
 * Re-validates everything server-side rather than trusting the GET result -
 * the pin could have been used, revoked, or the version deleted in the gap
 * between the two calls.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const pin = String(body?.pin || "").trim();
  const versionId = body?.versionId;

  if (!isSixDigits(pin)) {
    return NextResponse.json({ error: "Enter a 6-digit PIN" }, { status: 400 });
  }
  if (!versionId) {
    return NextResponse.json({ error: "Choose a build to download" }, { status: 400 });
  }

  await ensureSchema();
  const db = sql();

  const { row, reason } = await loadActivePin(db, pin);
  if (!row) {
    return NextResponse.json({ error: reason }, { status: 403 });
  }

  const [version] = await db`SELECT * FROM plugin_versions WHERE id = ${versionId}`;
  if (!version) {
    return NextResponse.json({ error: "That build no longer exists" }, { status: 404 });
  }

  // Atomically burn the pin - guard the WHERE clause with the same
  // liveness checks so two near-simultaneous requests for the same pin
  // can't both succeed (only the first UPDATE actually matches a row).
  const [burned] = await db`
    UPDATE download_pins
    SET used_at = now(), used_version_id = ${version.id}
    WHERE id = ${row.id} AND used_at IS NULL AND revoked = false AND expires_at > now()
    RETURNING id
  `;
  if (!burned) {
    return NextResponse.json({ error: "PIN was just used or expired - ask for a new one" }, { status: 403 });
  }

  await db`UPDATE plugin_versions SET download_count = download_count + 1 WHERE id = ${version.id}`;

  const bytes = Buffer.from(version.file_bytes, "base64");
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/java-archive",
      "Content-Disposition": `attachment; filename="${version.filename}"`,
      "Content-Length": String(bytes.length),
      "X-Veyrix-Version": version.version_label,
    },
  });
}
