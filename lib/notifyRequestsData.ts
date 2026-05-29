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
  /** Set when an admin marked the row read (persists in Supabase). */
  readAt?: string;
}

type NotifyRequestRow = {
  id: string;
  property_id: string;
  property_title: string;
  name: string;
  email: string;
  date_from: string | null;
  created_at: string;
  read_at?: string | null;
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
    readAt: r.readAt ? String(r.readAt) : undefined,
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
    readAt: row.read_at ?? undefined,
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
    read_at: normalized.readAt ?? null,
  };
}

const NOTIFY_SELECT_WITH_READ =
  "id,property_id,property_title,name,email,date_from,created_at,read_at";
const NOTIFY_SELECT_LEGACY =
  "id,property_id,property_title,name,email,date_from,created_at";

async function readNotifyRequestsFromSupabase(): Promise<NotifyRequest[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseServerClient();
  const withRead = await supabase
    .from("notify_requests")
    .select(NOTIFY_SELECT_WITH_READ)
    .order("created_at", { ascending: true });
  const result =
    withRead.error?.message?.includes("read_at")
      ? await supabase
          .from("notify_requests")
          .select(NOTIFY_SELECT_LEGACY)
          .order("created_at", { ascending: true })
      : withRead;
  if (result.error) {
    throw new Error(`[supabase] notify_requests read failed: ${result.error.message}`);
  }
  return ((result.data as NotifyRequestRow[] | null) ?? []).map(mapRowToRequest);
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

export function isNotifyRequestUnread(r: NotifyRequest): boolean {
  return !r.readAt;
}

export async function getNotifyUnreadCount(): Promise<number> {
  const requests = await getNotifyRequests();
  return requests.filter(isNotifyRequestUnread).length;
}

async function updateNotifyReadAt(
  filter: { id?: string }
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();
  let query = supabase.from("notify_requests").update({ read_at: now }).is("read_at", null);
  if (filter.id) query = query.eq("id", filter.id);
  const { error } = await query;
  if (error?.message?.includes("read_at")) return false;
  if (error) {
    throw new Error(`[supabase] notify_requests mark read failed: ${error.message}`);
  }
  return true;
}

export async function markNotifyRequestRead(id: string): Promise<void> {
  await updateNotifyReadAt({ id });
}

export async function markAllNotifyRequestsRead(): Promise<void> {
  await updateNotifyReadAt({});
}
