import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { sql, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { versionId } = await params;
  const { setLatest, notes } = await req.json();

  await ensureSchema();
  const db = sql();

  if (setLatest) {
    await db`UPDATE plugin_versions SET is_latest = false`;
    await db`UPDATE plugin_versions SET is_latest = true WHERE id = ${versionId}`;
  }
  if (typeof notes === "string") {
    await db`UPDATE plugin_versions SET notes = ${notes} WHERE id = ${versionId}`;
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { versionId } = await params;
  await ensureSchema();
  const db = sql();
  await db`DELETE FROM plugin_versions WHERE id = ${versionId}`;
  return NextResponse.json({ ok: true });
}
