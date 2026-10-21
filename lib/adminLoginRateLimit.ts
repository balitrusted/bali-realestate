import { createHash } from "node:crypto";

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

type AttemptState = {
  failures: number;
  windowStartedAt: number;
  blockedUntil: number;
};

type RateLimitStore = typeof globalThis & {
  __adminLoginAttempts?: Map<string, AttemptState>;
};

const globalStore = globalThis as RateLimitStore;
const attempts = (globalStore.__adminLoginAttempts ??= new Map());

function getClientKey(request: Request): string {
  const address =
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  return createHash("sha256").update(address).digest("hex");
}

function getAttemptState(key: string, now: number): AttemptState {
  const existing = attempts.get(key);
  if (
    existing &&
    (existing.blockedUntil > now || now < existing.windowStartedAt + WINDOW_MS)
  ) {
    return existing;
  }

  const state = { failures: 0, windowStartedAt: now, blockedUntil: 0 };
  attempts.set(key, state);
  return state;
}

export function checkAdminLoginRateLimit(
  request: Request,
  now = Date.now()
): { allowed: boolean; retryAfterSeconds: number } {
  const state = getAttemptState(getClientKey(request), now);
  if (state.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((state.blockedUntil - now) / 1000)),
    };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordAdminLoginFailure(request: Request, now = Date.now()): void {
  const key = getClientKey(request);
  const state = getAttemptState(key, now);
  state.failures += 1;
  if (state.failures >= MAX_FAILED_ATTEMPTS) {
    state.blockedUntil = now + WINDOW_MS;
  }

  if (attempts.size > 5000) {
    for (const [entryKey, entry] of attempts) {
      if (entry.windowStartedAt + WINDOW_MS <= now && entry.blockedUntil <= now) {
        attempts.delete(entryKey);
      }
    }
  }
}

export function clearAdminLoginFailures(request: Request): void {
  attempts.delete(getClientKey(request));
}