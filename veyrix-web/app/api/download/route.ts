import { NextRequest, NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { parseAndVerifyKey } from "@/lib/license";

export const dynamic = "force-dynamic";

/**
 * GET /api/download?key=<key>[&version=<id>]
 *
 * Called by the plugin (or a manual `/veyrix license <key>` flow) to fetch
 * the plugin jar itself. The offline HMAC signature check happens first -
 * a syntactically invalid or forged key never touches the database. Only
 * once that passes do we check revocation status against license_keys and
 * hand back a version.
 *
 * Without `version`, the current `is_latest` build is served.
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const versionId = req.nextUrl.searchParams.get("version");

  if (!key) {
    return NextResponse.json({ error: "key query param is required" }, { status: 400 });
  }

  const parsed = parseAndVerifyKey(key);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid license key" }, { status: 403 });
  }
  if (parsed.isExpired) {
    return NextResponse.json({ error: "License key has expired" }, { status: 403 });
  }

  await ensureSchema();
  const db = sql();

  const [row] = await db`
    SELECT revoked FROM license_keys WHERE key_id = ${parsed.keyId}
  `;
  // A key that verifies offline but was never activated (e.g. minted by the
  // CLI KeygenTool and never seen here) is still allowed - it self-registers
  // on the plugin's own /api/activate call, same as the README describes.
  if (row?.revoked) {
    return NextResponse.json({ error: "License key has been revoked" }, { status: 403 });
  }

  const [version] = versionId
    ? await db`SELECT * FROM plugin_versions WHERE id = ${versionId}`
    : await db`SELECT * FROM plugin_versions WHERE is_latest = true LIMIT 1`;

  if (!version) {
    return NextResponse.json({ error: "No plugin build is published yet" }, { status: 404 });
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
