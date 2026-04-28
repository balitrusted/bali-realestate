import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabaseServer";

const MAX_LOG_ROWS = 5000;
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

export async function getSearchQueryLogs(): Promise<SearchQueryLog[]> {
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

  const startedAt = Date.now();
  await writeSingleToSupabase(row);
  reportMetric("write_ok", { mode: "supabase", target: "supabase", elapsedMs: Date.now() - startedAt });
}
