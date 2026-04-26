import { list, put } from "@vercel/blob";
import { writeBlobJsonArrayWithRetry } from "@/lib/blobJsonOptimisticWrite";
import { getSearchQueryLogsRolloutMode } from "@/lib/dataRollout";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabaseServer";

const BLOB_KEY = "data/search-queries.json";
const MAX_LOG_ROWS = 5000;
const getBlobStoreBaseUrl = () => process.env.BLOB_STORE_URL?.trim().replace(/\/$/, "");
const OBS_ENABLED = process.env.DATA_MIGRATION_OBSERVABILITY === "1";

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

type SearchQueryLogsRow = {
  id: string;
  query: string;
  source: SearchLogSource;
  path: string | null;
  property_id: string | null;
  user_agent: string | null;
  created_at: string;
};

function reportMetric(
  event: string,
  details: Record<string, string | number | boolean | null | undefined>
): void {
  if (!OBS_ENABLED) return;
  console.info(`[search_query_logs] ${event}`, details);
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

async function readFromSupabase(): Promise<SearchQueryLog[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("search_query_logs")
    .select("id, query, source, path, property_id, user_agent, created_at")
    .order("created_at", { ascending: true })
    .limit(MAX_LOG_ROWS);
  if (error) {
    throw new Error(`[supabase] read failed: ${error.message}`);
  }
  return ((data as SearchQueryLogsRow[] | null) ?? []).map((row) => ({
    id: row.id,
    query: row.query,
    source: row.source,
    path: row.path ?? undefined,
    propertyId: row.property_id ?? undefined,
    userAgent: row.user_agent ?? undefined,
    createdAt: row.created_at,
  }));
}

async function writeSingleToSupabase(row: SearchQueryLog): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("[supabase] not configured");
  }
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("search_query_logs").upsert(
    {
      id: row.id,
      query: row.query,
      source: row.source,
      path: row.path ?? null,
      property_id: row.propertyId ?? null,
      user_agent: row.userAgent ?? null,
      created_at: row.createdAt,
    },
    { onConflict: "id", ignoreDuplicates: false }
  );
  if (error) {
    throw new Error(`[supabase] write failed: ${error.message}`);
  }
}

async function getSearchLogsFromBlobOrFile(): Promise<SearchQueryLog[]> {
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

export async function getSearchQueryLogs(): Promise<SearchQueryLog[]> {
  const mode = getSearchQueryLogsRolloutMode();
  const startedAt = Date.now();

  if (mode === "supabase") {
    try {
      const rows = await readFromSupabase();
      reportMetric("read_ok", {
        mode,
        source: "supabase",
        rows: rows.length,
        elapsedMs: Date.now() - startedAt,
      });
      return rows;
    } catch (error) {
      console.error("[search_query_logs] Supabase read failed, fallback to Blob/JSON:", error);
      const fallbackRows = await getSearchLogsFromBlobOrFile();
      reportMetric("read_fallback", {
        mode,
        source: "blob_or_file",
        rows: fallbackRows.length,
        elapsedMs: Date.now() - startedAt,
      });
      return fallbackRows;
    }
  }

  const rows = await getSearchLogsFromBlobOrFile();
  reportMetric("read_ok", {
    mode,
    source: "blob_or_file",
    rows: rows.length,
    elapsedMs: Date.now() - startedAt,
  });
  return rows;
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

  const mode = getSearchQueryLogsRolloutMode();
  const startedAt = Date.now();

  const writeBlobSide = async () => {
    await writeBlobJsonArrayWithRetry({
      read: getSearchLogsFromBlobOrFile,
      write: saveSearchQueryLogs,
      mutate: (rows) => {
        rows.push(row);
        if (rows.length > MAX_LOG_ROWS) {
          rows.splice(0, rows.length - MAX_LOG_ROWS);
        }
        return rows;
      },
    });
  };

  if (mode === "blob") {
    await writeBlobSide();
    reportMetric("write_ok", { mode, target: "blob_or_file", elapsedMs: Date.now() - startedAt });
    return;
  }

  if (mode === "dual-write") {
    await writeBlobSide();
    try {
      await writeSingleToSupabase(row);
      reportMetric("write_ok", { mode, target: "supabase", elapsedMs: Date.now() - startedAt });
    } catch (error) {
      console.error("[search_query_logs] dual-write Supabase write failed:", error);
      reportMetric("write_error", { mode, target: "supabase", elapsedMs: Date.now() - startedAt });
    }
    return;
  }

  try {
    await writeSingleToSupabase(row);
    reportMetric("write_ok", { mode, target: "supabase", elapsedMs: Date.now() - startedAt });
  } catch (error) {
    console.error("[search_query_logs] Supabase write failed, fallback to Blob/JSON:", error);
    await writeBlobSide();
    reportMetric("write_fallback", { mode, target: "blob_or_file", elapsedMs: Date.now() - startedAt });
  }
}
