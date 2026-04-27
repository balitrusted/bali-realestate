import { NextResponse } from "next/server";
import { list, put } from "@vercel/blob";
import { MutationHttpError, writeBlobJsonArrayWithRetry } from "@/lib/blobJsonOptimisticWrite";
import { getRequestsRolloutMode } from "@/lib/dataRollout";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabaseServer";

const BLOB_KEY = "data/requests.json";
const getBlobStoreBaseUrl = () => process.env.BLOB_STORE_URL?.trim().replace(/\/$/, "");
const OBS_ENABLED = process.env.DATA_MIGRATION_OBSERVABILITY === "1";

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

type RequestRow = {
  id: string;
  request_type: string;
  name: string;
  email: string;
  whatsapp: string | null;
  preferred_contact: string | null;
  property_type: string | null;
  area: string | null;
  bedrooms: string | null;
  budget: string | null;
  budget_period: string | null;
  budget_currency: string | null;
  duration: string[] | null;
  message: string | null;
  property_id: string | null;
  property_title: string | null;
  property_url: string | null;
  desired_start: string | null;
  status: RequestStatus | null;
  comment: string | null;
  created_at: string;
};

function reportMetric(
  event: string,
  details: Record<string, string | number | boolean | null | undefined>
): void {
  if (!OBS_ENABLED) return;
  console.info(`[requests] ${event}`, details);
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

function mapRowToRequest(row: RequestRow): SiteRequest {
  return normalizeRequest({
    id: row.id,
    requestType: row.request_type,
    name: row.name,
    email: row.email,
    whatsapp: row.whatsapp ?? undefined,
    preferredContact: row.preferred_contact ?? undefined,
    propertyType: row.property_type ?? undefined,
    area: row.area ?? undefined,
    bedrooms: row.bedrooms ?? undefined,
    budget: row.budget ?? undefined,
    budgetPeriod: row.budget_period ?? undefined,
    budgetCurrency: row.budget_currency ?? undefined,
    duration: row.duration ?? undefined,
    message: row.message ?? undefined,
    propertyId: row.property_id ?? undefined,
    propertyTitle: row.property_title ?? undefined,
    propertyUrl: row.property_url ?? undefined,
    desiredStart: row.desired_start ?? undefined,
    status: row.status ?? "new",
    comment: row.comment ?? undefined,
    createdAt: row.created_at,
  });
}

function mapRequestToRow(r: SiteRequest): RequestRow {
  return {
    id: r.id,
    request_type: r.requestType,
    name: r.name,
    email: r.email,
    whatsapp: r.whatsapp ?? null,
    preferred_contact: r.preferredContact ?? null,
    property_type: r.propertyType ?? null,
    area: r.area ?? null,
    bedrooms: r.bedrooms ?? null,
    budget: r.budget ?? null,
    budget_period: r.budgetPeriod ?? null,
    budget_currency: r.budgetCurrency ?? null,
    duration: r.duration ?? [],
    message: r.message ?? null,
    property_id: r.propertyId ?? null,
    property_title: r.propertyTitle ?? null,
    property_url: r.propertyUrl ?? null,
    desired_start: r.desiredStart ?? null,
    status: r.status ?? "new",
    comment: r.comment ?? null,
    created_at: r.createdAt,
  };
}

async function readFromSupabase(): Promise<SiteRequest[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("requests")
    .select(
      "id,request_type,name,email,whatsapp,preferred_contact,property_type,area,bedrooms,budget,budget_period,budget_currency,duration,message,property_id,property_title,property_url,desired_start,status,comment,created_at"
    )
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(`[supabase] requests read failed: ${error.message}`);
  }
  return ((data as RequestRow[] | null) ?? []).map(mapRowToRequest);
}

async function writeOneToSupabase(request: SiteRequest): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("[supabase] not configured");
  }
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("requests")
    .upsert(mapRequestToRow(request), { onConflict: "id", ignoreDuplicates: false });
  if (error) {
    throw new Error(`[supabase] requests write failed: ${error.message}`);
  }
}

async function patchOneInSupabase(
  id: string,
  patch: { status?: RequestStatus; comment?: string }
): Promise<SiteRequest> {
  if (!isSupabaseConfigured()) {
    throw new Error("[supabase] not configured");
  }
  const supabase = getSupabaseServerClient();
  const nextUpdate: { status?: RequestStatus; comment?: string | null } = {};
  if (patch.status !== undefined) nextUpdate.status = patch.status;
  if (patch.comment !== undefined) nextUpdate.comment = patch.comment ?? null;
  const { data, error } = await supabase
    .from("requests")
    .update(nextUpdate)
    .eq("id", id)
    .select(
      "id,request_type,name,email,whatsapp,preferred_contact,property_type,area,bedrooms,budget,budget_period,budget_currency,duration,message,property_id,property_title,property_url,desired_start,status,comment,created_at"
    )
    .maybeSingle();
  if (error) {
    throw new Error(`[supabase] requests update failed: ${error.message}`);
  }
  if (!data) {
    throw new MutationHttpError(
      NextResponse.json({ error: "Request not found" }, { status: 404 })
    );
  }
  return mapRowToRequest(data as RequestRow);
}

async function getRequestsFromBlobOrFile(): Promise<SiteRequest[]> {
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

/**
 * Get all requests (admin only).
 * When BLOB_READ_WRITE_TOKEN is set, read only from Blob — never fall back to data/requests.json.
 * Otherwise PATCH saves to Blob but GET would re-read the repo file and “lose” status/comments after refresh.
 */
export async function getRequests(): Promise<SiteRequest[]> {
  const mode = getRequestsRolloutMode();
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
      console.error("[requests] Supabase read failed, fallback to Blob/JSON:", error);
      const fallbackRows = await getRequestsFromBlobOrFile();
      reportMetric("read_fallback", {
        mode,
        source: "blob_or_file",
        rows: fallbackRows.length,
        elapsedMs: Date.now() - startedAt,
      });
      return fallbackRows;
    }
  }
  const rows = await getRequestsFromBlobOrFile();
  reportMetric("read_ok", {
    mode,
    source: "blob_or_file",
    rows: rows.length,
    elapsedMs: Date.now() - startedAt,
  });
  return rows;
}

/** Append one request. Saves to Blob on Vercel, else to file. */
export async function addRequest(request: SiteRequest): Promise<void> {
  const mode = getRequestsRolloutMode();
  const startedAt = Date.now();
  const normalizedRequest = normalizeRequest({ ...request, status: "new" });

  const writeBlobSide = async () => {
    await writeBlobJsonArrayWithRetry({
      read: getRequestsFromBlobOrFile,
      write: saveRequests,
      mutate: (requests) => {
        if (requests.some((r) => r.id === normalizedRequest.id)) {
          return requests.map(normalizeRequest);
        }
        requests.push(normalizedRequest);
        return requests.map(normalizeRequest);
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
      await writeOneToSupabase(normalizedRequest);
      reportMetric("write_ok", { mode, target: "supabase", elapsedMs: Date.now() - startedAt });
    } catch (error) {
      console.error("[requests] dual-write Supabase write failed:", error);
      reportMetric("write_error", { mode, target: "supabase", elapsedMs: Date.now() - startedAt });
    }
    return;
  }

  try {
    await writeOneToSupabase(normalizedRequest);
    reportMetric("write_ok", { mode, target: "supabase", elapsedMs: Date.now() - startedAt });
  } catch (error) {
    console.error("[requests] Supabase write failed, fallback to Blob/JSON:", error);
    await writeBlobSide();
    reportMetric("write_fallback", { mode, target: "blob_or_file", elapsedMs: Date.now() - startedAt });
  }
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
  const mode = getRequestsRolloutMode();
  const startedAt = Date.now();

  if (mode === "supabase") {
    try {
      const updated = await patchOneInSupabase(id, patch);
      reportMetric("update_ok", { mode, target: "supabase", elapsedMs: Date.now() - startedAt });
      return updated;
    } catch (error) {
      if (error instanceof MutationHttpError) throw error;
      console.error("[requests] Supabase update failed, fallback to Blob/JSON:", error);
      reportMetric("update_fallback", {
        mode,
        target: "blob_or_file",
        elapsedMs: Date.now() - startedAt,
      });
    }
  }

  let result!: SiteRequest;
  await writeBlobJsonArrayWithRetry({
    read: getRequestsFromBlobOrFile,
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

  if (mode === "dual-write") {
    try {
      await patchOneInSupabase(id, patch);
      reportMetric("update_ok", { mode, target: "supabase", elapsedMs: Date.now() - startedAt });
    } catch (error) {
      if (error instanceof MutationHttpError) throw error;
      console.error("[requests] dual-write Supabase update failed:", error);
      reportMetric("update_error", { mode, target: "supabase", elapsedMs: Date.now() - startedAt });
    }
  } else {
    reportMetric("update_ok", { mode, target: "blob_or_file", elapsedMs: Date.now() - startedAt });
  }

  return result;
}
