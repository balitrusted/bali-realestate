import { NextResponse } from "next/server";
import { MutationHttpError } from "@/lib/blobJsonOptimisticWrite";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabaseServer";
import { normalizeRequestAttribution, type RequestAttribution } from "@/lib/attribution";

const OBS_ENABLED = process.env.DATA_MIGRATION_OBSERVABILITY === "1";

export type RequestStatus = "new" | "in_progress" | "done" | "cancelled";

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
  attribution?: RequestAttribution;
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
  attribution?: unknown;
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

function parseRequestStatus(value: string | null | undefined): RequestStatus {
  if (value === "in_progress" || value === "done" || value === "cancelled") return value;
  return "new";
}

function normalizeRequest(r: SiteRequest): SiteRequest {
  return { ...r, status: parseRequestStatus(r.status) };
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
    attribution: normalizeRequestAttribution(row.attribution),
    status: parseRequestStatus(row.status),
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
    attribution: r.attribution ?? null,
    status: parseRequestStatus(r.status),
    comment: r.comment ?? null,
    created_at: r.createdAt,
  };
}

function isMissingAttributionColumn(error: { message?: string } | null | undefined): boolean {
  const msg = error?.message || "";
  return msg.includes("attribution");
}

async function readFromSupabase(): Promise<SiteRequest[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseServerClient();
  let data: RequestRow[] | null = null;
  let error: { message?: string } | null = null;
  {
    const first = await supabase
      .from("requests")
      .select(
        "id,request_type,name,email,whatsapp,preferred_contact,property_type,area,bedrooms,budget,budget_period,budget_currency,duration,message,property_id,property_title,property_url,desired_start,attribution,status,comment,created_at"
      )
      .order("created_at", { ascending: true });
    data = (first.data as RequestRow[] | null) ?? null;
    error = first.error;
  }
  if (error && isMissingAttributionColumn(error)) {
    const fallback = await supabase
      .from("requests")
      .select(
        "id,request_type,name,email,whatsapp,preferred_contact,property_type,area,bedrooms,budget,budget_period,budget_currency,duration,message,property_id,property_title,property_url,desired_start,status,comment,created_at"
      )
      .order("created_at", { ascending: true });
    data = (fallback.data as RequestRow[] | null) ?? null;
    error = fallback.error;
  }
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
  let { error } = await supabase
    .from("requests")
    .upsert(mapRequestToRow(request), { onConflict: "id", ignoreDuplicates: false });
  if (error && isMissingAttributionColumn(error)) {
    const row = mapRequestToRow(request);
    delete row.attribution;
    ({ error } = await supabase
      .from("requests")
      .upsert(row, { onConflict: "id", ignoreDuplicates: false }));
  }
  if (error) {
    throw new Error(`[supabase] requests write failed: ${error.message}`);
  }
}

async function deleteOneFromSupabase(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("[supabase] not configured");
  }
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("requests").delete().eq("id", id).select("id");
  if (error) {
    throw new Error(`[supabase] requests delete failed: ${error.message}`);
  }
  if (!data?.length) {
    throw new MutationHttpError(
      NextResponse.json({ error: "Request not found" }, { status: 404 })
    );
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
  let { data, error } = await supabase
    .from("requests")
    .update(nextUpdate)
    .eq("id", id)
    .select(
      "id,request_type,name,email,whatsapp,preferred_contact,property_type,area,bedrooms,budget,budget_period,budget_currency,duration,message,property_id,property_title,property_url,desired_start,attribution,status,comment,created_at"
    )
    .maybeSingle();
  if (error && isMissingAttributionColumn(error)) {
    ({ data, error } = await supabase
      .from("requests")
      .update(nextUpdate)
      .eq("id", id)
      .select(
        "id,request_type,name,email,whatsapp,preferred_contact,property_type,area,bedrooms,budget,budget_period,budget_currency,duration,message,property_id,property_title,property_url,desired_start,status,comment,created_at"
      )
      .maybeSingle());
  }
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

export async function getRequests(): Promise<SiteRequest[]> {
  const startedAt = Date.now();
  const rows = await readFromSupabase();
  reportMetric("read_ok", {
    mode: "supabase",
    source: "supabase",
    rows: rows.length,
    elapsedMs: Date.now() - startedAt,
  });
  return rows;
}

/** Append one request. Saves to Blob on Vercel, else to file. */
export async function addRequest(request: SiteRequest): Promise<void> {
  const startedAt = Date.now();
  const normalizedRequest = normalizeRequest({ ...request, status: "new" });
  await writeOneToSupabase(normalizedRequest);
  reportMetric("write_ok", { mode: "supabase", target: "supabase", elapsedMs: Date.now() - startedAt });
}

/** Update one request (status and/or comment). Throws MutationHttpError(404) if missing. */
export async function updateRequest(
  id: string,
  patch: { status?: RequestStatus; comment?: string }
): Promise<SiteRequest> {
  const startedAt = Date.now();
  const updated = await patchOneInSupabase(id, patch);
  reportMetric("update_ok", { mode: "supabase", target: "supabase", elapsedMs: Date.now() - startedAt });
  return updated;
}

/** Remove one request (admin). Throws MutationHttpError(404) if missing. */
export async function deleteRequest(id: string): Promise<void> {
  const startedAt = Date.now();
  await deleteOneFromSupabase(id);
  reportMetric("delete_ok", { mode: "supabase", target: "supabase", elapsedMs: Date.now() - startedAt });
}
