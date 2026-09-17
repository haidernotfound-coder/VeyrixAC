import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { sql, ensureSchema } from "@/lib/db";
import { generatePin } from "@/lib/license";

export const dynamic = "force-dynamic";

const DEFAULT_TTL_SECONDS = 24 * 60 * 60; // 24 hours

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureSchema();
  const db = sql();
  const pins = await db`
    SELECT p.id, p.pin, p.label, p.created_at, p.expires_at, p.used_at, p.revoked,
           v.version_label AS used_version_label
    FROM download_pins p
    LEFT JOIN plugin_versions v ON v.id = p.used_version_id
    ORDER BY p.created_at DESC
    LIMIT 200
  `;
  return NextResponse.json({ pins });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const label: string | undefined = body?.label || undefined;
    const ttlSeconds: number =
      typeof body?.ttlSeconds === "number" && body.ttlSeconds > 0
        ? body.ttlSeconds
        : DEFAULT_TTL_SECONDS;

    await ensureSchema();
    const db = sql();

    // A 6-digit PIN can collide with an old, already-used/expired one -
    // that's fine and expected, since this space is meant to be reused
    // once a pin is consumed. We only need to avoid colliding with a pin
    // that's still *active* right now.
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const pin = generatePin();
      try {
        const [clash] = await db`
          SELECT id FROM download_pins
          WHERE pin = ${pin} AND used_at IS NULL AND revoked = false AND expires_at > now()
        `;
        if (clash) continue;
        const [row] = await db`
          INSERT INTO download_pins (pin, label, expires_at)
          VALUES (${pin}, ${label ?? null}, now() + (${ttlSeconds} * interval '1 second'))
          RETURNING id, pin, label, created_at, expires_at
        `;
        return NextResponse.json({ pin: row });
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError ?? new Error("Could not generate a unique PIN, try again");
  } catch (err: unknown) {
    console.error("create pin error", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
