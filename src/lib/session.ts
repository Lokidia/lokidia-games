import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "__gestion_sid";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function getSecret(): string {
  const secret = process.env.ADMIN_SECRET ?? process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("ADMIN_SECRET or ADMIN_PASSWORD env var is required");
  return secret;
}

/** Build a signed session token: base64url(payload).hmac */
export function createSessionToken(email: string): string {
  const secret  = getSecret();
  const expiry   = Date.now() + SESSION_TTL_MS;
  const payload  = Buffer.from(JSON.stringify({ email, expiry })).toString("base64url");
  const sig      = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

/** Verify a session token. Returns the email on success, null otherwise. */
export function verifySessionToken(token: string): string | null {
  try {
    const secret   = getSecret();
    const dot      = token.lastIndexOf(".");
    if (dot === -1) return null;

    const payload  = token.slice(0, dot);
    const sig      = token.slice(dot + 1);
    const expected = createHmac("sha256", secret).update(payload).digest("base64url");

    // Constant-time comparison to prevent timing attacks
    const sigBuf      = Buffer.from(sig);
    const expectedBuf = Buffer.from(expected);
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      email: string;
      expiry: number;
    };

    if (Date.now() > data.expiry) return null;
    return data.email;
  } catch {
    return null;
  }
}

/** Validate login credentials against env vars */
export function checkCredentials(email: string, password: string): boolean {
  const expectedEmail    = process.env.ADMIN_EMAIL    ?? "";
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";

  if (!expectedEmail || !expectedPassword) return false;

  // Constant-time comparison for both fields
  const emailMatch = safeEqual(email.toLowerCase(), expectedEmail.toLowerCase());
  const passMatch  = safeEqual(password, expectedPassword);
  return emailMatch && passMatch;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still do a comparison to avoid timing leaks on length
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}
