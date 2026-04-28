import { loadEnvConfig } from "@next/env";
import { getNotifyRequests } from "../lib/notifyRequestsData";
import { getSupabaseServerClient, isSupabaseConfigured } from "../lib/supabaseServer";

loadEnvConfig(process.cwd());

function mapNotifyRequest(row: Awaited<ReturnType<typeof getNotifyRequests>>[number]) {
  return {
    id: row.id,
    property_id: row.propertyId,
    property_title: row.propertyTitle ?? "",
    name: row.name,
    email: row.email,
    date_from: row.dateFrom ?? null,
    created_at: row.createdAt,
  };
}

async function main() {
  if (!isSupabaseConfigured()) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const previousMode = process.env.NOTIFY_REQUESTS_ROLLOUT_MODE;
  process.env.NOTIFY_REQUESTS_ROLLOUT_MODE = "blob";
  const requests = await getNotifyRequests();
  process.env.NOTIFY_REQUESTS_ROLLOUT_MODE = previousMode;

  if (!requests.length) {
    console.log("No notify requests to backfill.");
    return;
  }

  const dedupedById = new Map<string, ReturnType<typeof mapNotifyRequest>>();
  for (const row of requests) {
    dedupedById.set(row.id, mapNotifyRequest(row));
  }
  const payload = Array.from(dedupedById.values());
  const duplicatesRemoved = requests.length - payload.length;

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("notify_requests")
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
