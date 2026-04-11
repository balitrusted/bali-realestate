import { NextResponse } from "next/server";
import { list, put } from "@vercel/blob";
import { MutationHttpError, writeBlobJsonArrayWithRetry } from "@/lib/blobJsonOptimisticWrite";

const BLOB_KEY = "data/requests.json";
const getBlobStoreBaseUrl = () => process.env.BLOB_STORE_URL?.trim().replace(/\/$/, "");

export type RequestStatus = "new" | "in_progress" | "done";

export interface SiteRequest {
  id: string;
  requestType: string;
  name: string;
  email: string;
  whatsapp?: string;
  preferredContact?: string;
  propertyType?: string;
  area?: string;
  bedrooms?: string;
  budget?: string;
  budgetPeriod?: string;
  budgetCurrency?: string;
  duration?: string[];
  message?: string;
  /** Listing the user contacted from (property detail). */
  propertyId?: string;
  propertyTitle?: string;
  propertyUrl?: string;
  /** Preferred move-in / start (property-book). ISO date string. */
  desiredStart?: string;
  status?: RequestStatus;
  comment?: string;
  createdAt: string;
}

async function readFromBlob(): Promise<SiteRequest[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];
  try {
    const baseUrl = getBlobStoreBaseUrl();
    // Prefer direct fetch (no list()) to avoid Advanced Requests.
    if (baseUrl) {
      const url = `${baseUrl}/${BLOB_KEY}`;
      const urlWithCacheBust = `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
      const res = await fetch(urlWithCacheBust, {
        cache: "no-store",
        headers: { Pragma: "no-cache", "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      }
      // Direct URL can 404 if BLOB_STORE_URL is wrong; fall through to list()+fetch by pathname.
    }

    const { blobs } = await list({ prefix: "data/", limit: 100 });
    const match = blobs?.find((b) => b.pathname === BLOB_KEY);
    if (!match?.url) return [];
    const urlWithCacheBust = `${match.url}${match.url.includes("?") ? "&" : "?"}t=${Date.now()}`;
    const res = await fetch(urlWithCacheBust, { cache: "no-store", headers: { Pragma: "no-cache", "Cache-Control": "no-cache" } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeToBlob(requests: SiteRequest[]): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  await put(BLOB_KEY, JSON.stringify(requests), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    cacheControlMaxAge: 0,
  });
}

function normalizeRequest(r: SiteRequest): SiteRequest {
  return { ...r, status: r.status || "new" };
}

/**
 * Get all requests (admin only).
 * When BLOB_READ_WRITE_TOKEN is set, read only from Blob — never fall back to data/requests.json.
 * Otherwise PATCH saves to Blob but GET would re-read the repo file and “lose” status/comments after refresh.
 */
export async function getRequests(): Promise<SiteRequest[]> {
  let raw: SiteRequest[] = [];
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    raw = await readFromBlob();
  } else {
    try {
      const { readFile } = await import("fs/promises");
      const { join } = await import("path");
      const path = join(process.cwd(), "data", "requests.json");
      const content = await readFile(path, "utf-8");
      const data = JSON.parse(content);
      raw = Array.isArray(data) ? data : [];
    } catch {
      raw = [];
    }
  }
  return raw.map(normalizeRequest);
}

/** Append one request. Saves to Blob on Vercel, else to file. */
export async function addRequest(request: SiteRequest): Promise<void> {
  await writeBlobJsonArrayWithRetry({
    read: getRequests,
    write: saveRequests,
    mutate: (requests) => {
      if (requests.some((r) => r.id === request.id)) {
        return requests.map(normalizeRequest);
      }
      requests.push({ ...request, status: "new" });
      return requests.map(normalizeRequest);
    },
  });
}

/** Save full list (used after update). */
export async function saveRequests(requests: SiteRequest[]): Promise<void> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await writeToBlob(requests);
  } else {
    const { writeFile } = await import("fs/promises");
    const { join } = await import("path");
    const path = join(process.cwd(), "data", "requests.json");
    await writeFile(path, JSON.stringify(requests, null, 2), "utf-8");
  }
}

/** Update one request (status and/or comment). Throws MutationHttpError(404) if missing. */
export async function updateRequest(
  id: string,
  patch: { status?: RequestStatus; comment?: string }
): Promise<SiteRequest> {
  let result!: SiteRequest;
  await writeBlobJsonArrayWithRetry({
    read: getRequests,
    write: saveRequests,
    mutate: (requests) => {
      const index = requests.findIndex((r) => r.id === id);
      if (index === -1) {
        throw new MutationHttpError(
          NextResponse.json({ error: "Request not found" }, { status: 404 })
        );
      }
      const row = { ...requests[index] };
      if (patch.status !== undefined) row.status = patch.status;
      if (patch.comment !== undefined) row.comment = patch.comment;
      const normalized = normalizeRequest(row);
      requests[index] = normalized;
      result = normalized;
      return requests.map(normalizeRequest);
    },
  });
  return result;
}
