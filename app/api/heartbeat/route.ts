import { NextRequest, NextResponse } from "next/server";
import { parseAndVerifyKey } from "@/lib/license";
import { sql, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Called periodically by the plugin (every ~60s, see LicenseManager)
 * while it's running, so "last seen" / active-install status stays fresh
 * and a remote revoke takes effect within about a minute instead of
 * waiting for a restart.
 *
 * Body: { key: string, serverIp: string, serverName?: string, pluginVersion?: string, playerCount?: number }
 *   OR:  { keyId: string, ... } - same fields, but identifying the key by
 *   its numeric ID rather than the full signed string. license.dat only
 *   persists derived fields (see LicenseState.java), not the raw key
 *   string, so after a server restart the plugin can't reconstruct the
 *   signed key to send here - it sends the keyId it already has instead.
 *   This is safe: keyId alone was already offline-verified once at
 *   activation time (LicenseManager binds it to license.dat's HMAC), and
 *   this endpoint only ever narrows validity (checks revoked/expired) -
 *   it can't be used to forge a license that wasn't already active.
 * Response: { valid: boolean, reason?: string, latestVersion?: string,
 *             downloadUrl?: string, sha256?: string }
 *   If valid is false, the plugin should disable itself (mirrors the
 *   original "fail closed" philosophy in LicenseManager).
 *
 *   The latestVersion/downloadUrl/sha256 trio is how auto-update piggybacks
 *   on this existing once-a-minute channel instead of adding a second one
 *   (see UpdateManager.java). It is only ever included when a key is valid
 *   AND a published version's checksum is available - a plugin with no
 *   sha256 on file is never advertised as an update target, since that
 *   checksum is the only thing UpdateManager verifies a downloaded jar
 *   against before it's allowed to replace anything running on someone
 *   else's server. This endpoint being reachable/malicious is the actual
 *   threat model for a remote-code-push feature, so it deliberately does
 *   NOT vary this response based on the caller's reported pluginVersion -
 *   the plugin decides for itself, client-side, whether an update is
 *   needed by comparing latestVersion to its own getPluginMeta().getVersion(),
 *   so a compromised or malicious response here can at most ever point at
 *   whatever is actually stored as is_latest in plugin_versions, never at
 *   an arbitrary attacker-hosted URL.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, keyId: rawKeyId, serverIp, serverName, pluginVersion, playerCount } = body ?? {};

    let keyId: string;
    if (typeof key === "string" && key) {
      const parsed = parseAndVerifyKey(key);
      if (!parsed) {
        return NextResponse.json({ valid: false, reason: "Invalid signature" }, { status: 200 });
      }
      if (parsed.isExpired) {
        return NextResponse.json({ valid: false, reason: "Key expired" }, { status: 200 });
      }
      keyId = parsed.keyId;
    } else if (typeof rawKeyId === "string" && rawKeyId) {
      keyId = rawKeyId;
    } else {
      return NextResponse.json({ valid: false, reason: "Missing key or keyId" }, { status: 400 });
    }

    await ensureSchema();
    const db = sql();

    const rows = await db`
      SELECT expiry_epoch_seconds, revoked FROM license_keys WHERE key_id = ${keyId}
    `;
    if (rows.length > 0) {
      if (rows[0].revoked) {
        return NextResponse.json({ valid: false, reason: "Key revoked" }, { status: 200 });
      }
      const expiry = Number(rows[0].expiry_epoch_seconds);
      if (expiry >= 0 && Math.floor(Date.now() / 1000) > expiry) {
        return NextResponse.json({ valid: false, reason: "Key expired" }, { status: 200 });
      }
    }
    // If the key has never been seen here at all (rows.length === 0), it
    // was minted offline by the CLI KeygenTool and never activated against
    // this website - that's fine, same "self-registers on first contact"
    // behavior as /api/activate. We still record the install below.

    await db`
      INSERT INTO installations (key_id, server_ip, server_name, plugin_version, player_count)
      VALUES (${keyId}, ${serverIp ?? null}, ${serverName ?? null}, ${pluginVersion ?? null}, ${playerCount ?? null})
      ON CONFLICT (key_id, server_ip)
      DO UPDATE SET last_seen = now(), server_name = EXCLUDED.server_name,
                    plugin_version = EXCLUDED.plugin_version, player_count = EXCLUDED.player_count
    `;

    // Auto-update advertisement (see doc comment above). Only the current
    // is_latest row is ever considered, and only when it has a checksum -
    // an upload made before the sha256 column existed, or one that somehow
    // ended up null, is never served as an update target.
    const [latest] = await db`
      SELECT version_label, sha256 FROM plugin_versions
      WHERE is_latest = true AND sha256 IS NOT NULL
      LIMIT 1
    `;
    if (latest) {
      const origin = req.nextUrl.origin;
      return NextResponse.json({
        valid: true,
        latestVersion: latest.version_label,
        downloadUrl: `${origin}/api/download?key=${encodeURIComponent(
          typeof key === "string" ? key : ""
        )}&keyId=${encodeURIComponent(keyId)}`,
        sha256: latest.sha256,
      });
    }

    return NextResponse.json({ valid: true });
  } catch (err) {
    console.error("heartbeat error", err);
    // Fail open on our own server errors (matches original network-failure
    // handling philosophy being intentional elsewhere, but a website outage
    // should not instantly disable every paying customer's server).
    return NextResponse.json({ valid: true, reason: "Server error, ignored" }, { status: 200 });
  }
}
