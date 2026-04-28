import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabaseServer";

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
  const startedAt = Date.now();
  const rows = await readNotifyRequestsFromSupabase();
  reportMetric("read_ok", { mode: "supabase", source: "supabase", rows: rows.length, elapsedMs: Date.now() - startedAt });
  return rows;
}

export async function addNotifyRequest(request: NotifyRequest): Promise<void> {
  const startedAt = Date.now();
  const normalizedRequest = normalizeRequest(request);
  await writeOneNotifyRequestToSupabase(normalizedRequest);
  reportMetric("write_ok", { mode: "supabase", target: "supabase", elapsedMs: Date.now() - startedAt });
}
