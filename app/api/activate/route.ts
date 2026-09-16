import { NextRequest, NextResponse } from "next/server";
import { parseAndVerifyKey } from "@/lib/license";
import { sql, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Called by the plugin (LicenseManager) once, when a key is activated via
 * /veyrix license <key>. This does NOT replace the plugin's own offline
 * HMAC verification (it still works with no internet at all) - it just
 * additionally records the activation so it shows up in the admin panel,
 * and lets you remotely revoke a key going forward.
 *
 * Body: { key: string, serverIp: string, serverName?: string, pluginVersion?: string, playerCount?: number }
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

    // Self-heal: if this key was minted by KeygenTool directly (not via this
    // website), register it on first activation so it still shows in the panel.
    if (rows.length === 0) {
      await db`
        INSERT INTO license_keys (key_id, key_string, expiry_epoch_seconds)
        VALUES (${parsed.keyId}, ${key}, ${parsed.expiryEpochSeconds})
        ON CONFLICT (key_id) DO NOTHING
      `;
    }

    await db`
      INSERT INTO installations (key_id, server_ip, server_name, plugin_version, player_count)
      VALUES (${parsed.keyId}, ${serverIp ?? null}, ${serverName ?? null}, ${pluginVersion ?? null}, ${playerCount ?? null})
      ON CONFLICT (key_id, server_ip)
      DO UPDATE SET last_seen = now(), server_name = EXCLUDED.server_name,
                    plugin_version = EXCLUDED.plugin_version, player_count = EXCLUDED.player_count
    `;

    return NextResponse.json({
      valid: true,
      permanent: parsed.isPermanent,
      expiryEpochSeconds: parsed.expiryEpochSeconds,
    });
  } catch (err) {
    console.error("activate error", err);
    return NextResponse.json({ valid: false, reason: "Server error" }, { status: 500 });
  }
}
