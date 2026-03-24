import { safeInternalPath } from "@/lib/propertyViewNavigation";

export const LISTING_RETURN_STORAGE_KEY = "balitrusted-listing-return";

/** Call before navigating to a property detail URL so Back can use a clean catalog URL. */
export function persistListingReturnPath(path: string): void {
  const s = safeInternalPath(path);
  if (!s || typeof window === "undefined") return;
  try {
    sessionStorage.setItem(LISTING_RETURN_STORAGE_KEY, s);
  } catch {
    /* private mode / quota */
  }
}

export function readPersistedListingReturnPath(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LISTING_RETURN_STORAGE_KEY);
    return raw ? safeInternalPath(raw) : null;
  } catch {
    return null;
  }
}
