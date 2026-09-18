import { NextRequest, NextResponse } from "next/server";
import { parseAndVerifyKey } from "@/lib/license";
import { sql, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Called periodically by the plugin (every ~15 min, see LicenseManager)
 * while it's running, so "last seen" / active-install status stays fresh
 * and a remote revoke takes effect quickly instead of only on next restart.
 *
 * Body: { key: string, serverIp: string, serverName?: string, pluginVersion?: string, playerCount?: number }
 * Response: { valid: boolean, reason?: string }
 *   If valid is false, the plugin should disable itself (mirrors the
 *   original "fail closed" philosophy in LicenseManager).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, serverIp, serverName, pluginVersion, playerCount } = body ?? {};

    if (!key || typeof key !== "string") {
      return NextResponse.json({ valid: false, reason: "Missing key" }, { status: 400 });
    }

    const parsed = parseAndVerifyKey(key);
    if (!parsed) {
      return NextResponse.json({ valid: false, reason: "Invalid signature" }, { status: 200 });
    }
    if (parsed.isExpired) {
      return NextResponse.json({ valid: false, reason: "Key expired" }, { status: 200 });
    }

    await ensureSchema();
    const db = sql();

    const rows = await db`
      SELECT revoked FROM license_keys WHERE key_id = ${parsed.keyId}
    `;
    if (rows.length > 0 && rows[0].revoked) {
      return NextResponse.json({ valid: false, reason: "Key revoked" }, { status: 200 });
    }

    await db`
      INSERT INTO installations (key_id, server_ip, server_name, plugin_version, player_count)
      VALUES (${parsed.keyId}, ${serverIp ?? null}, ${serverName ?? null}, ${pluginVersion ?? null}, ${playerCount ?? null})
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
