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

// DELETE: revokes the key rather than physically removing its row.
//
// BUG FIX: this used to run `DELETE FROM license_keys WHERE key_id = ...`,
// which also cascaded to delete the key's `installations` rows (see the
// FK in lib/db.ts). The problem is what that did to /api/heartbeat: that
// endpoint's revoked-check only runs `if (rows.length > 0)` - a key with
// no row at all falls through to the "never seen here, self-registering
// for the first time" path (see its own comment) and returns
// `valid: true`. So deleting a key made it validate FOREVER, with no way
// to ever revoke it again since there was no row left to flip - strictly
// MORE permissive than doing nothing, and the opposite of "disable this
// license." A plugin instance activated before the delete (or one that
// never phoned home at all, per LicenseManager's own offline-only mode)
// would keep passing its heartbeat indefinitely.
//
// Setting `revoked = true` instead reuses the exact check heartbeat
// already gets right for a normal revoke, keeps the key's install
// history intact for the admin panel, and still shows up in GET
// /api/admin/keys (now correctly marked revoked) instead of vanishing.
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
  await db`
    UPDATE license_keys
    SET revoked = true, revoked_at = now()
    WHERE key_id = ${keyId}
  `;
  return NextResponse.json({ ok: true });
}
