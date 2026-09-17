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
  try {
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
  } catch (err: unknown) {
    console.error("patch version error", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { versionId } = await params;
  try {
    await ensureSchema();
    const db = sql();
    const [deleted] = await db`
      DELETE FROM plugin_versions WHERE id = ${versionId} RETURNING id
    `;
    if (!deleted) {
      return NextResponse.json({ error: "Build not found (already deleted?)" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("delete version error", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
