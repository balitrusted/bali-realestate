/** Edge-safe (no Node imports): shared by lib/auth.ts and middleware.ts. */
export const ADMIN_SESSION_TTL_SECONDS = 48 * 60 * 60;
export const ADMIN_SESSION_TTL_MS = ADMIN_SESSION_TTL_SECONDS * 1000;
