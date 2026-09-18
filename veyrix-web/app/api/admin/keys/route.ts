import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { sql, ensureSchema } from "@/lib/db";
import { generateKey, durationToExpiry } from "@/lib/license";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureSchema();
  const db = sql();

  const keys = await db`
    SELECT
      k.key_id,
      k.key_string,
      k.label,
      k.expiry_epoch_seconds,
      k.created_at,
      k.revoked,
      k.revoked_at,
      COUNT(i.id)::int AS install_count,
      MAX(i.last_seen) AS last_seen
    FROM license_keys k
    LEFT JOIN installations i ON i.key_id = k.key_id
    GROUP BY k.key_id, k.key_string, k.label, k.expiry_epoch_seconds, k.created_at, k.revoked, k.revoked_at
    ORDER BY k.created_at DESC
  `;

  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { duration, label } = await req.json();
    if (typeof duration !== "string") {
      return NextResponse.json({ error: "duration is required (e.g. '30d', '6mo', '1y', 'permanent')" }, { status: 400 });
    }
    const expiry = durationToExpiry(duration);
    const generated = generateKey(expiry);

    await ensureSchema();
    const db = sql();
    await db`
      INSERT INTO license_keys (key_id, key_string, label, expiry_epoch_seconds)
      VALUES (${generated.keyId}, ${generated.keyString}, ${label ?? null}, ${generated.expiryEpochSeconds})
    `;

    return NextResponse.json({ key: generated });
  } catch (err: any) {
    console.error("create key error", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}
