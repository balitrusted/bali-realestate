import { loadEnvConfig } from "@next/env";
import { getSearchQueryLogs } from "../lib/searchQueryLogs";
import { getSupabaseServerClient, isSupabaseConfigured } from "../lib/supabaseServer";

loadEnvConfig(process.cwd());

async function main() {
  if (!isSupabaseConfigured()) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const previousMode = process.env.SEARCH_QUERY_LOGS_ROLLOUT_MODE;
  process.env.SEARCH_QUERY_LOGS_ROLLOUT_MODE = "blob";
  const logs = await getSearchQueryLogs();
  process.env.SEARCH_QUERY_LOGS_ROLLOUT_MODE = previousMode;
  if (!logs.length) {
    console.log("No search logs to backfill.");
    return;
  }

  const supabase = getSupabaseServerClient();
  const dedupedById = new Map<
    string,
    {
      id: string;
      query: string;
      source: string;
      path: string | null;
      property_id: string | null;
      user_agent: string | null;
      created_at: string;
    }
  >();
  for (const row of logs) {
    dedupedById.set(row.id, {
      id: row.id,
      query: row.query,
      source: row.source,
      path: row.path ?? null,
      property_id: row.propertyId ?? null,
      user_agent: row.userAgent ?? null,
      created_at: row.createdAt,
    });
  }
  const payload = Array.from(dedupedById.values());
  const duplicatesRemoved = logs.length - payload.length;

  const { error } = await supabase
    .from("search_query_logs")
    .upsert(payload, { onConflict: "id", ignoreDuplicates: false });

  if (error) {
    console.error("Backfill failed:", error.message);
    process.exit(1);
  }

  console.log(
    `Backfill done: ${payload.length} unique rows upserted (removed duplicates: ${duplicatesRemoved}).`
  );
}

void main();
