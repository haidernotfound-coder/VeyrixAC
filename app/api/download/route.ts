import { NextRequest, NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { parseAndVerifyKey } from "@/lib/license";

export const dynamic = "force-dynamic";

/**
 * GET /api/download?key=<key>[&version=<id>]
 * GET /api/download?keyId=<numeric keyId>[&version=<id>]
 *
 * Called by the plugin (or a manual `/veyrix license <key>` flow) to fetch
 * the plugin jar itself. The offline HMAC signature check happens first -
 * a syntactically invalid or forged key never touches the database. Only
 * once that passes do we check revocation status against license_keys and
 * hand back a version.
 *
 * `keyId` (numeric only, no signature to verify) is accepted for the same
 * reason /api/heartbeat accepts it: license.dat only persists the derived
 * keyId after a restart, not the original signed key string (see
 * LicenseManager.java), and UpdateManager's auto-update download can run
 * long after activation with only that keyId on hand. This does not weaken
 * anything an attacker could exploit: a bare keyId still has to match a
 * row in license_keys that is not revoked/expired below, exactly like the
 * signed-key path, and knowing another server's keyId doesn't reveal or
 * activate anything - at most it lets a third party download the same
 * public plugin jar, which /api/download already hands out to anyone
 * holding a valid key string.
 *
 * Without `version`, the current `is_latest` build is served.
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const rawKeyId = req.nextUrl.searchParams.get("keyId");
  const versionId = req.nextUrl.searchParams.get("version");

  let keyId: string;
  if (key) {
    const parsed = parseAndVerifyKey(key);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid license key" }, { status: 403 });
    }
    if (parsed.isExpired) {
      return NextResponse.json({ error: "License key has expired" }, { status: 403 });
    }
    keyId = parsed.keyId;
  } else if (rawKeyId) {
    keyId = rawKeyId;
  } else {
    return NextResponse.json({ error: "key or keyId query param is required" }, { status: 400 });
  }

  await ensureSchema();
  const db = sql();

  const [row] = await db`
    SELECT revoked, expiry_epoch_seconds FROM license_keys WHERE key_id = ${keyId}
  `;
  // A key that verifies offline but was never activated (e.g. minted by the
  // CLI KeygenTool and never seen here) is still allowed - it self-registers
  // on the plugin's own /api/activate call, same as the README describes.
  // (This only applies to the signed `key` path above - a bare `keyId` with
  // no matching row here has nothing to self-register from, so it's
  // rejected instead of silently allowed through.)
  if (row?.revoked) {
    return NextResponse.json({ error: "License key has been revoked" }, { status: 403 });
  }
  if (!key && !row) {
    return NextResponse.json({ error: "Unknown keyId" }, { status: 403 });
  }
  if (row) {
    const expiry = Number(row.expiry_epoch_seconds);
    if (expiry >= 0 && Math.floor(Date.now() / 1000) > expiry) {
      return NextResponse.json({ error: "License key has expired" }, { status: 403 });
    }
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
