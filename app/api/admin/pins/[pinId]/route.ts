import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { sql, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ pinId: string }> }
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { pinId } = await params;
  await ensureSchema();
  const db = sql();
  // Revoke rather than delete - keeps redemption history intact, and
  // matches the "revoking is usually what you want" convention already
  // used for license keys.
  await db`UPDATE download_pins SET revoked = true WHERE id = ${pinId}`;
  return NextResponse.json({ ok: true });
}
