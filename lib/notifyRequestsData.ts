import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { list, put } from "@vercel/blob";
import { getNotifyRequestsRolloutMode } from "@/lib/dataRollout";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabaseServer";

const DATA_FILE = join(process.cwd(), "data", "notify-requests.json");
const BLOB_KEY = "data/notify-requests.json";
const OBS_ENABLED = process.env.DATA_MIGRATION_OBSERVABILITY === "1";

export interface NotifyRequest {
  id: string;
  propertyId: string;
  propertyTitle: string;
  name: string;
  email: string;
  dateFrom?: string;
  createdAt: string;
}

type NotifyRequestRow = {
  id: string;
  property_id: string;
  property_title: string;
  name: string;
  email: string;
  date_from: string | null;
  created_at: string;
};

function reportMetric(
  event: string,
  details: Record<string, string | number | boolean | null | undefined>
): void {
  if (!OBS_ENABLED) return;
  console.info(`[notify_requests] ${event}`, details);
}

function getBlobStoreBaseUrl(): string | undefined {
  return process.env.BLOB_STORE_URL?.trim().replace(/\/$/, "");
}

function appendCacheBuster(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${Date.now()}`;
}

function normalizeRequest(r: NotifyRequest): NotifyRequest {
  return {
    id: String(r.id),
    propertyId: String(r.propertyId),
    propertyTitle: String(r.propertyTitle ?? ""),
    name: String(r.name),
    email: String(r.email),
    dateFrom: r.dateFrom ? String(r.dateFrom) : undefined,
    createdAt: String(r.createdAt),
  };
}

function mapRowToRequest(row: NotifyRequestRow): NotifyRequest {
  return normalizeRequest({
    id: row.id,
    propertyId: row.property_id,
    propertyTitle: row.property_title,
    name: row.name,
    email: row.email,
    dateFrom: row.date_from ?? undefined,
    createdAt: row.created_at,
  });
}

function mapRequestToRow(r: NotifyRequest): NotifyRequestRow {
  const normalized = normalizeRequest(r);
  return {
    id: normalized.id,
    property_id: normalized.propertyId,
    property_title: normalized.propertyTitle,
    name: normalized.name,
    email: normalized.email,
    date_from: normalized.dateFrom ?? null,
    created_at: normalized.createdAt,
  };
}

async function readNotifyRequestsFromBlobRaw(): Promise<NotifyRequest[] | null> {
  const baseUrl = getBlobStoreBaseUrl();
  if (baseUrl) {
    const res = await fetch(appendCacheBuster(`${baseUrl}/${BLOB_KEY}`), { cache: "no-store" });
    if (res.ok) {
      const data: unknown = await res.json();
      if (Array.isArray(data)) return data as NotifyRequest[];
    }
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const { blobs } = await list({ prefix: BLOB_KEY, limit: 5 });
  const match = blobs?.find((b) => b.pathname === BLOB_KEY);
  if (match?.url) {
    const res = await fetch(appendCacheBuster(match.url), { cache: "no-store" });
    if (res.ok) {
      const data: unknown = await res.json();
      if (Array.isArray(data)) return data as NotifyRequest[];
    }
  }
  return null;
}

async function readNotifyRequestsFromBlobOrFile(): Promise<NotifyRequest[]> {
  try {
    const fromBlob = await readNotifyRequestsFromBlobRaw();
    if (fromBlob) return fromBlob.map(normalizeRequest);
  } catch {
    /* fallback */
  }

  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.map(normalizeRequest) : [];
  } catch {
    return [];
  }
}

async function writeNotifyRequestsToBlobOrFile(requests: NotifyRequest[]): Promise<void> {
  const normalized = requests.map(normalizeRequest);
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await put(BLOB_KEY, JSON.stringify(normalized), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      cacheControlMaxAge: 0,
    });
    return;
  }
  await writeFile(DATA_FILE, JSON.stringify(normalized, null, 2), "utf-8");
}

async function readNotifyRequestsFromSupabase(): Promise<NotifyRequest[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("notify_requests")
    .select("id,property_id,property_title,name,email,date_from,created_at")
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(`[supabase] notify_requests read failed: ${error.message}`);
  }
  return ((data as NotifyRequestRow[] | null) ?? []).map(mapRowToRequest);
}

async function writeOneNotifyRequestToSupabase(request: NotifyRequest): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("[supabase] not configured");
  }
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("notify_requests")
    .upsert(mapRequestToRow(request), { onConflict: "id", ignoreDuplicates: false });
  if (error) {
    throw new Error(`[supabase] notify_requests write failed: ${error.message}`);
  }
}

export async function getNotifyRequests(): Promise<NotifyRequest[]> {
  const mode = getNotifyRequestsRolloutMode();
  const startedAt = Date.now();
  if (mode === "supabase") {
    try {
      const rows = await readNotifyRequestsFromSupabase();
      reportMetric("read_ok", { mode, source: "supabase", rows: rows.length, elapsedMs: Date.now() - startedAt });
      return rows;
    } catch (error) {
      console.error("[notify_requests] Supabase read failed, fallback to Blob/JSON:", error);
      const fallbackRows = await readNotifyRequestsFromBlobOrFile();
      reportMetric("read_fallback", {
        mode,
        source: "blob_or_file",
        rows: fallbackRows.length,
        elapsedMs: Date.now() - startedAt,
      });
      return fallbackRows;
    }
  }
  const rows = await readNotifyRequestsFromBlobOrFile();
  reportMetric("read_ok", { mode, source: "blob_or_file", rows: rows.length, elapsedMs: Date.now() - startedAt });
  return rows;
}

export async function addNotifyRequest(request: NotifyRequest): Promise<void> {
  const mode = getNotifyRequestsRolloutMode();
  const startedAt = Date.now();
  const normalizedRequest = normalizeRequest(request);

  const writeBlobSide = async () => {
    const rows = await readNotifyRequestsFromBlobOrFile();
    rows.push(normalizedRequest);
    await writeNotifyRequestsToBlobOrFile(rows);
  };

  if (mode === "blob") {
    await writeBlobSide();
    reportMetric("write_ok", { mode, target: "blob_or_file", elapsedMs: Date.now() - startedAt });
    return;
  }

  if (mode === "dual-write") {
    await writeBlobSide();
    try {
      await writeOneNotifyRequestToSupabase(normalizedRequest);
      reportMetric("write_ok", { mode, target: "supabase", elapsedMs: Date.now() - startedAt });
    } catch (error) {
      console.error("[notify_requests] dual-write Supabase write failed:", error);
      reportMetric("write_error", { mode, target: "supabase", elapsedMs: Date.now() - startedAt });
    }
    return;
  }

  try {
    await writeOneNotifyRequestToSupabase(normalizedRequest);
    reportMetric("write_ok", { mode, target: "supabase", elapsedMs: Date.now() - startedAt });
  } catch (error) {
    console.error("[notify_requests] Supabase write failed, fallback to Blob/JSON:", error);
    await writeBlobSide();
    reportMetric("write_fallback", { mode, target: "blob_or_file", elapsedMs: Date.now() - startedAt });
  }
}
