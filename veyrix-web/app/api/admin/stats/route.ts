import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { sql, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureSchema();
  const db = sql();

  const [{ total_keys }] = await db`SELECT COUNT(*)::int AS total_keys FROM license_keys`;
  const [{ active_keys }] = await db`SELECT COUNT(*)::int AS active_keys FROM license_keys WHERE revoked = false`;
  const [{ total_installs }] = await db`SELECT COUNT(*)::int AS total_installs FROM installations`;
  const [{ active_installs }] = await db`
    SELECT COUNT(*)::int AS active_installs FROM installations WHERE last_seen > now() - interval '30 minutes'
  `;

  return NextResponse.json({ total_keys, active_keys, total_installs, active_installs });
}
