import { loadEnvConfig } from "@next/env";
import { getSupabaseServerClient, isSupabaseConfigured } from "../lib/supabaseServer";

loadEnvConfig(process.cwd());

type NotifyRequest = {
  id: string;
  propertyId: string;
  propertyTitle: string;
  name: string;
  email: string;
  dateFrom?: string;
  createdAt: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing ${name}.`);
    process.exit(1);
  }
  return value;
}

async function loadFromProdJson(): Promise<NotifyRequest[]> {
  const rawUrl = requireEnv("PROD_NOTIFY_REQUESTS_JSON_URL");
  const res = await fetch(rawUrl, { cache: "no-store" });
  if (!res.ok) {
    console.error(`Failed to fetch prod notify requests JSON: ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    console.error("PROD_NOTIFY_REQUESTS_JSON_URL did not return an array.");
    process.exit(1);
  }
  return data as NotifyRequest[];
}

function mapNotifyRequest(row: NotifyRequest) {
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

  const sourceRows = await loadFromProdJson();
  const dedupedById = new Map<string, ReturnType<typeof mapNotifyRequest>>();
  for (const row of sourceRows) {
    dedupedById.set(row.id, mapNotifyRequest(row));
  }
  const payload = Array.from(dedupedById.values());
  const duplicatesRemoved = sourceRows.length - payload.length;

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("notify_requests")
    .upsert(payload, { onConflict: "id", ignoreDuplicates: false });

  if (error) {
    console.error("Backfill failed:", error.message);
    process.exit(1);
  }

  console.log(
    `Backfill from prod done: ${payload.length} unique rows upserted (removed duplicates: ${duplicatesRemoved}).`
  );
}

void main();
