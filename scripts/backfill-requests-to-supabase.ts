import { loadEnvConfig } from "@next/env";
import { getRequests } from "../lib/requestsData";
import { getSupabaseServerClient, isSupabaseConfigured } from "../lib/supabaseServer";

loadEnvConfig(process.cwd());

async function main() {
  if (!isSupabaseConfigured()) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const previousMode = process.env.REQUESTS_ROLLOUT_MODE;
  process.env.REQUESTS_ROLLOUT_MODE = "blob";
  const requests = await getRequests();
  process.env.REQUESTS_ROLLOUT_MODE = previousMode;

  if (!requests.length) {
    console.log("No requests to backfill.");
    return;
  }

  const dedupedById = new Map<string, ReturnType<typeof mapRequest>>();
  for (const row of requests) {
    dedupedById.set(row.id, mapRequest(row));
  }
  const payload = Array.from(dedupedById.values());
  const duplicatesRemoved = requests.length - payload.length;

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("requests")
    .upsert(payload, { onConflict: "id", ignoreDuplicates: false });

  if (error) {
    console.error("Backfill failed:", error.message);
    process.exit(1);
  }

  console.log(
    `Backfill done: ${payload.length} unique rows upserted (removed duplicates: ${duplicatesRemoved}).`
  );
}

function mapRequest(row: Awaited<ReturnType<typeof getRequests>>[number]) {
  return {
    id: row.id,
    request_type: row.requestType,
    name: row.name,
    email: row.email,
    whatsapp: row.whatsapp ?? null,
    preferred_contact: row.preferredContact ?? null,
    property_type: row.propertyType ?? null,
    area: row.area ?? null,
    bedrooms: row.bedrooms ?? null,
    budget: row.budget ?? null,
    budget_period: row.budgetPeriod ?? null,
    budget_currency: row.budgetCurrency ?? null,
    duration: row.duration ?? [],
    message: row.message ?? null,
    property_id: row.propertyId ?? null,
    property_title: row.propertyTitle ?? null,
    property_url: row.propertyUrl ?? null,
    desired_start: row.desiredStart ?? null,
    status: row.status ?? "new",
    comment: row.comment ?? null,
    created_at: row.createdAt,
  };
}

void main();
