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
 * Response: { valid: boolean, reason?: string }
 *   If valid is false, the plugin should disable itself (mirrors the
 *   original "fail closed" philosophy in LicenseManager).
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

    return NextResponse.json({ valid: true });
  } catch (err) {
    console.error("heartbeat error", err);
    // Fail open on our own server errors (matches original network-failure
    // handling philosophy being intentional elsewhere, but a website outage
    // should not instantly disable every paying customer's server).
    return NextResponse.json({ valid: true, reason: "Server error, ignored" }, { status: 200 });
  }
}
