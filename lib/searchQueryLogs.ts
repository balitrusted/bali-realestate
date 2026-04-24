import { list, put } from "@vercel/blob";
import { writeBlobJsonArrayWithRetry } from "@/lib/blobJsonOptimisticWrite";

const BLOB_KEY = "data/search-queries.json";
const MAX_LOG_ROWS = 5000;
const getBlobStoreBaseUrl = () => process.env.BLOB_STORE_URL?.trim().replace(/\/$/, "");

export type SearchLogSource =
  | "site_search_submit"
  | "site_search_suggestion_click"
  | "search_page_view";

export interface SearchQueryLog {
  id: string;
  query: string;
  source: SearchLogSource;
  path?: string;
  propertyId?: string;
  userAgent?: string;
  createdAt: string;
}

async function readFromBlob(): Promise<SearchQueryLog[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];
  try {
    const baseUrl = getBlobStoreBaseUrl();
    if (baseUrl) {
      const url = `${baseUrl}/${BLOB_KEY}`;
      const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`, {
        cache: "no-store",
        headers: { Pragma: "no-cache", "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      }
    }

    const { blobs } = await list({ prefix: "data/", limit: 200 });
    const match = blobs.find((b) => b.pathname === BLOB_KEY);
    if (!match?.url) return [];
    const res = await fetch(`${match.url}${match.url.includes("?") ? "&" : "?"}t=${Date.now()}`, {
      cache: "no-store",
      headers: { Pragma: "no-cache", "Cache-Control": "no-cache" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeToBlob(rows: SearchQueryLog[]): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  await put(BLOB_KEY, JSON.stringify(rows), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    cacheControlMaxAge: 0,
  });
}

export async function getSearchQueryLogs(): Promise<SearchQueryLog[]> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return readFromBlob();
  }
  try {
    const { readFile } = await import("fs/promises");
    const { join } = await import("path");
    const path = join(process.cwd(), "data", "search-queries.json");
    const data = JSON.parse(await readFile(path, "utf-8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function saveSearchQueryLogs(rows: SearchQueryLog[]): Promise<void> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await writeToBlob(rows);
    return;
  }
  const { writeFile } = await import("fs/promises");
  const { join } = await import("path");
  const path = join(process.cwd(), "data", "search-queries.json");
  await writeFile(path, JSON.stringify(rows, null, 2), "utf-8");
}

export async function addSearchQueryLog(input: Omit<SearchQueryLog, "id" | "createdAt">): Promise<void> {
  const query = input.query.trim();
  if (!query) return;

  const row: SearchQueryLog = {
    id: `sq-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    query: query.slice(0, 140),
    source: input.source,
    path: input.path?.slice(0, 140),
    propertyId: input.propertyId?.slice(0, 64),
    userAgent: input.userAgent?.slice(0, 260),
    createdAt: new Date().toISOString(),
  };

  await writeBlobJsonArrayWithRetry({
    read: getSearchQueryLogs,
    write: saveSearchQueryLogs,
    mutate: (rows) => {
      rows.push(row);
      if (rows.length > MAX_LOG_ROWS) {
        rows.splice(0, rows.length - MAX_LOG_ROWS);
      }
      return rows;
    },
  });
}
