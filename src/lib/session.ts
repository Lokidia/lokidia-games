/**
 * Session helpers using the Web Crypto API (crypto.subtle).
 * Compatible with Next.js Edge Runtime — no node:crypto dependency.
 */

export const SESSION_COOKIE = "__gestion_sid";

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 h
const enc = new TextEncoder();
const dec = new TextDecoder();

// ── Base64url helpers ────────────────────────────────────────────────────────

function bufToBase64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64urlToBuf(b64url: string): ArrayBuffer {
  const b64    = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const ab     = new ArrayBuffer(binary.length);
  const view   = new Uint8Array(ab);
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
  return ab;
}

function encodePayload(obj: unknown): string {
  return bufToBase64url(enc.encode(JSON.stringify(obj)));
}

function decodePayload<T>(b64url: string): T {
  return JSON.parse(dec.decode(base64urlToBuf(b64url))) as T;
}

// ── HMAC key helpers ─────────────────────────────────────────────────────────

function importHmacKey(secret: string, usages: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages,
  );
}

function getSecret(): string {
  const s = process.env.ADMIN_SECRET ?? process.env.ADMIN_PASSWORD;
  if (!s) throw new Error("ADMIN_SECRET or ADMIN_PASSWORD env var is required");
  return s;
}

// ── Timing-safe string equality ──────────────────────────────────────────────

/**
 * Compare two strings in constant time.
 * Uses HMAC-SHA256: computes sigA = HMAC(key, a) then calls
 * crypto.subtle.verify(sigA, b) — which checks HMAC(key, a) === HMAC(key, b).
 * crypto.subtle.verify is spec'd to be timing-safe.
 */
async function safeEqual(a: string, b: string): Promise<boolean> {
  const key  = await importHmacKey("constant-eq-key", ["sign", "verify"]);
  const sigA = await crypto.subtle.sign("HMAC", key, enc.encode(a));
  return crypto.subtle.verify("HMAC", key, sigA, enc.encode(b));
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Build a signed session token: base64url(payload).base64url(hmac) */
export async function createSessionToken(email: string): Promise<string> {
  const secret  = getSecret();
  const expiry  = Date.now() + SESSION_TTL_MS;
  const payload = encodePayload({ email, expiry });

  const key    = await importHmacKey(secret, ["sign"]);
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const sig    = bufToBase64url(sigBuf);

  return `${payload}.${sig}`;
}

/** Verify a session token. Returns the email on success, null on any failure. */
export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const secret = getSecret();
    const dot    = token.lastIndexOf(".");
    if (dot === -1) return null;

    const payload = token.slice(0, dot);
    const sigBuf  = base64urlToBuf(token.slice(dot + 1));

    const key   = await importHmacKey(secret, ["verify"]);
    const valid = await crypto.subtle.verify("HMAC", key, sigBuf, enc.encode(payload));
    if (!valid) return null;

    const data = decodePayload<{ email: string; expiry: number }>(payload);
    if (Date.now() > data.expiry) return null;

    return data.email;
  } catch {
    return null;
  }
}

/** Validate login credentials against ADMIN_EMAIL / ADMIN_PASSWORD env vars */
export async function checkCredentials(email: string, password: string): Promise<boolean> {
  const expectedEmail    = process.env.ADMIN_EMAIL    ?? "";
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";

  if (!expectedEmail || !expectedPassword) return false;

  const [emailOk, passOk] = await Promise.all([
    safeEqual(email.toLowerCase(), expectedEmail.toLowerCase()),
    safeEqual(password, expectedPassword),
  ]);

  return emailOk && passOk;
}
