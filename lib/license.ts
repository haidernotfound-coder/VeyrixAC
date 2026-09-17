import crypto from "crypto";

/**
 * Mirrors com.veyrix.veyrix.license.LicenseKey (Java) exactly, so keys
 * minted here are byte-for-byte compatible with what the plugin verifies:
 *
 *   Format:  VEYRIX-<base64url payload>-<base64url HMAC-SHA256 signature>
 *   Payload: 16 bytes = int64 keyId (big-endian) + int64 expiryEpochSeconds (big-endian, -1 = permanent)
 *   Sig:     HMAC-SHA256(payload, secret)
 *
 * The secret MUST be the exact same 32 bytes (64 hex chars) as
 * LicenseSecret.VALUE in the plugin build you ship. Set it as the
 * LICENSE_SECRET_HEX environment variable on Vercel - never hardcode it.
 */

const PREFIX = "VEYRIX";

function getSecret(): Buffer {
  const hex = process.env.LICENSE_SECRET_HEX;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "LICENSE_SECRET_HEX env var must be set to the same 64-char hex secret used in LicenseSecret.VALUE"
    );
  }
  return Buffer.from(hex, "hex");
}

function base64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function hmac(payload: Buffer, secret: Buffer): Buffer {
  return crypto.createHmac("sha256", secret).update(payload).digest();
}

// Generates a cryptographically random positive int64, matching
// `new SecureRandom().nextLong() & Long.MAX_VALUE` in Java (top bit cleared).
function randomKeyId(): bigint {
  const bytes = crypto.randomBytes(8);
  bytes[0] &= 0x7f; // clear sign bit -> always positive, matches Java's & Long.MAX_VALUE
  return bytes.readBigInt64BE(0);
}

function int64BE(value: bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt.asIntN(64, value));
  return buf;
}

export interface GeneratedKey {
  keyId: string; // stringified bigint (JS can't hold full int64 range safely as number)
  keyString: string;
  expiryEpochSeconds: number; // -1 = permanent
}

/** expirySeconds: -1 for permanent, else absolute unix epoch seconds. */
export function generateKey(expiryEpochSeconds: number): GeneratedKey {
  const secret = getSecret();
  const keyId = randomKeyId();
  const payload = Buffer.concat([
    int64BE(keyId),
    int64BE(BigInt(expiryEpochSeconds)),
  ]);
  const sig = hmac(payload, secret);
  const keyString = `${PREFIX}-${base64url(payload)}-${base64url(sig)}`;
  return { keyId: keyId.toString(), keyString, expiryEpochSeconds };
}

export interface ParsedKey {
  keyId: string;
  expiryEpochSeconds: number;
  isPermanent: boolean;
  isExpired: boolean;
}

/** Parses and verifies a key string against LICENSE_SECRET_HEX. Returns null if invalid. */
export function parseAndVerifyKey(keyString: string): ParsedKey | null {
  if (!keyString) return null;
  const trimmed = keyString.trim();
  const parts = trimmed.split("-");
  if (parts.length !== 3 || parts[0] !== PREFIX) return null;

  let payload: Buffer;
  let sig: Buffer;
  try {
    payload = Buffer.from(parts[1], "base64url");
    sig = Buffer.from(parts[2], "base64url");
  } catch {
    return null;
  }
  if (payload.length !== 16) return null;

  const secret = getSecret();
  const expectedSig = hmac(payload, secret);
  if (
    expectedSig.length !== sig.length ||
    !crypto.timingSafeEqual(expectedSig, sig)
  ) {
    return null;
  }

  const keyId = payload.readBigInt64BE(0);
  const expiry = payload.readBigInt64BE(8);
  const expiryNum = Number(expiry);
  const isPermanent = expiryNum < 0;
  const isExpired = !isPermanent && Math.floor(Date.now() / 1000) > expiryNum;

  return {
    keyId: keyId.toString(),
    expiryEpochSeconds: expiryNum,
    isPermanent,
    isExpired,
  };
}

/** Duration helpers for the admin UI (mirrors KeygenTool's d/mo/y units). */
export function durationToExpiry(duration: string): number {
  if (duration === "permanent") return -1;
  const match = duration.match(/^(\d+)(d|mo|y)$/);
  if (!match) throw new Error("Invalid duration, use e.g. 30d, 6mo, 1y, or permanent");
  const amount = parseInt(match[1], 10);
  const unit = match[2];
  const now = Math.floor(Date.now() / 1000);
  const daySeconds = 86400;
  const days = unit === "d" ? amount : unit === "mo" ? amount * 30 : amount * 365;
  return now + days * daySeconds;
}

/** Generates a cryptographically random 6-digit numeric string, zero-padded (e.g. "004821"). */
export function generatePin(): string {
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, "0");
}
