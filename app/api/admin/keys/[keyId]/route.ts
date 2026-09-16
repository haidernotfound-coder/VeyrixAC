import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { sql, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

// PATCH: revoke (soft) - the key stops validating on next heartbeat/activation
// but stays in the table for history.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { keyId } = await params;
  const { revoked } = await req.json();

  await ensureSchema();
  const db = sql();
  await db`
    UPDATE license_keys
    SET revoked = ${!!revoked}, revoked_at = ${revoked ? new Date().toISOString() : null}
    WHERE key_id = ${keyId}
  `;
  return NextResponse.json({ ok: true });
}

// DELETE: permanently remove the key and its installation records.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { keyId } = await params;

  await ensureSchema();
  const db = sql();
  await db`DELETE FROM license_keys WHERE key_id = ${keyId}`;
  return NextResponse.json({ ok: true });
}
