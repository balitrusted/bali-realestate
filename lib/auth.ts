import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_TTL_SECONDS = 12 * 60 * 60;
const ADMIN_SESSION_TTL_MS = ADMIN_SESSION_TTL_SECONDS * 1000;

type AdminSessionPayload = {
  role: "admin";
  issuedAt: number;
  expiresAt: number;
  version: 1;
};

function getAdminPassword(): string | null {
  return process.env.ADMIN_PASSWORD?.trim() || null;
}

function getSessionSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET?.trim() || getAdminPassword();
}

function constantTimeStringEqual(input: string, expected: string): boolean {
  const inputHash = createHash("sha256").update(input).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(inputHash, expectedHash);
}

export function checkAuth(password: string): boolean {
  const adminPassword = getAdminPassword();
  return !!adminPassword && !!password && constantTimeStringEqual(password, adminPassword);
}

export function createAdminSessionToken(now = Date.now()): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;

  const payload: AdminSessionPayload = {
    role: "admin",
    issuedAt: now,
    expiresAt: now + ADMIN_SESSION_TTL_MS,
    version: 1,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export function isValidAdminSession(token?: string): boolean {
  const secret = getSessionSecret();
  if (!secret || !token) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [encodedPayload, encodedSignature] = parts;

  try {
    const actualSignature = Buffer.from(encodedSignature, "base64url");
    const expectedSignature = createHmac("sha256", secret).update(encodedPayload).digest();
    if (actualSignature.length !== expectedSignature.length) return false;
    if (!timingSafeEqual(actualSignature, expectedSignature)) return false;

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as AdminSessionPayload;
    const now = Date.now();
    return (
      payload.role === "admin" &&
      payload.version === 1 &&
      Number.isFinite(payload.issuedAt) &&
      Number.isFinite(payload.expiresAt) &&
      payload.issuedAt <= now + 60_000 &&
      payload.expiresAt > now &&
      payload.expiresAt <= payload.issuedAt + ADMIN_SESSION_TTL_MS
    );
  } catch {
    return false;
  }
}
