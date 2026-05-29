import { list, put } from "@vercel/blob";
import {
  getNotifyUnreadCount as getNotifyUnreadCountFromDb,
  markAllNotifyRequestsRead,
} from "@/lib/notifyRequestsData";

const BLOB_KEY = "data/admin-badge-state.json";
const getBlobStoreBaseUrl = () => process.env.BLOB_STORE_URL?.trim().replace(/\/$/, "");

export interface AdminBadgeState {
  /** ISO time — notify entries with createdAt after this count as "new" for the badge */
  notifyLastSeenAt: string | null;
}

function defaultState(): AdminBadgeState {
  return { notifyLastSeenAt: null };
}

async function readFromBlob(): Promise<AdminBadgeState | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const baseUrl = getBlobStoreBaseUrl();
    if (baseUrl) {
      const url = `${baseUrl}/${BLOB_KEY}`;
      const urlWithCacheBust = `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
      const res = await fetch(urlWithCacheBust, {
        cache: "no-store",
        headers: { Pragma: "no-cache", "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === "object" && "notifyLastSeenAt" in data) {
          return {
            notifyLastSeenAt:
              typeof data.notifyLastSeenAt === "string" ? data.notifyLastSeenAt : null,
          };
        }
      }
    }
    const { blobs } = await list({ prefix: "data/", limit: 100 });
    const match = blobs?.find((b) => b.pathname === BLOB_KEY);
    if (!match?.url) return null;
    const urlWithCacheBust = `${match.url}${match.url.includes("?") ? "&" : "?"}t=${Date.now()}`;
    const res = await fetch(urlWithCacheBust, { cache: "no-store", headers: { Pragma: "no-cache", "Cache-Control": "no-cache" } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && typeof data === "object" && "notifyLastSeenAt" in data) {
      return {
        notifyLastSeenAt:
          typeof data.notifyLastSeenAt === "string" ? data.notifyLastSeenAt : null,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function writeToBlob(state: AdminBadgeState): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  await put(BLOB_KEY, JSON.stringify(state), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

export async function readAdminBadgeState(): Promise<AdminBadgeState> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const fromBlob = await readFromBlob();
    if (fromBlob) return fromBlob;
    return defaultState();
  }
  try {
    const { readFile } = await import("fs/promises");
    const { join } = await import("path");
    const path = join(process.cwd(), "data", "admin-badge-state.json");
    const raw = await readFile(path, "utf-8");
    const data = JSON.parse(raw);
    if (data && typeof data === "object") {
      return {
        notifyLastSeenAt:
          typeof data.notifyLastSeenAt === "string" ? data.notifyLastSeenAt : null,
      };
    }
  } catch {
    /* missing file */
  }
  return defaultState();
}

export async function saveAdminBadgeState(state: AdminBadgeState): Promise<void> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await writeToBlob(state);
  } else {
    const { writeFile } = await import("fs/promises");
    const { join } = await import("path");
    const path = join(process.cwd(), "data", "admin-badge-state.json");
    await writeFile(path, JSON.stringify(state, null, 2), "utf-8");
  }
}

/** Effective “seen” time: latest of blob state and per-browser cookie (legacy fallback). */
export async function getLegacyNotifySeenAtMs(cookieSeenAt?: string): Promise<number> {
  const state = await readAdminBadgeState();
  const fromBlob = state.notifyLastSeenAt ? Date.parse(state.notifyLastSeenAt) : 0;
  const fromCookie = cookieSeenAt ? Date.parse(cookieSeenAt) : 0;
  return Math.max(
    Number.isFinite(fromBlob) ? fromBlob : 0,
    Number.isFinite(fromCookie) ? fromCookie : 0
  );
}

/**
 * Unread notify count. Prefer DB `read_at`; if column is missing, fall back to legacy timestamp.
 */
export async function getNotifyUnreadCount(cookieSeenAt?: string): Promise<number> {
  try {
    return await getNotifyUnreadCountFromDb();
  } catch (e) {
    console.error("getNotifyUnreadCount (db):", e);
    try {
      const { getNotifyRequests } = await import("@/lib/notifyRequestsData");
      const since = await getLegacyNotifySeenAtMs(cookieSeenAt);
      const requests = await getNotifyRequests();
      return requests.filter((r) => {
        const t = Date.parse(r.createdAt);
        return Number.isFinite(t) && t > since;
      }).length;
    } catch (e2) {
      console.error("getNotifyUnreadCount (legacy):", e2);
      return 0;
    }
  }
}

export async function markNotifyRequestsSeen(): Promise<void> {
  try {
    await markAllNotifyRequestsRead();
  } catch (e) {
    console.error("markAllNotifyRequestsRead:", e);
  }
  const state = await readAdminBadgeState();
  state.notifyLastSeenAt = new Date().toISOString();
  await saveAdminBadgeState(state);
}
