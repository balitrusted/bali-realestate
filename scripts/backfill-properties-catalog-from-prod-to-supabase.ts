import { loadEnvConfig } from "@next/env";
import { getSupabaseServerClient, isSupabaseConfigured } from "../lib/supabaseServer";

type PropertyLike = {
  id: string;
  archived?: boolean;
};

async function fetchProperties(baseUrl: string, archived: boolean): Promise<PropertyLike[]> {
  const url = `${baseUrl}/api/properties?archived=${archived ? "true" : "false"}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as { properties?: PropertyLike[] };
  return Array.isArray(json.properties) ? json.properties : [];
}

async function main() {
  loadEnvConfig(process.cwd());

  if (!isSupabaseConfigured()) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const baseUrl = (process.argv[2] ?? "https://balitrusted.com").replace(/\/$/, "");
  const [active, archived] = await Promise.all([
    fetchProperties(baseUrl, false),
    fetchProperties(baseUrl, true),
  ]);

  const byId = new Map<string, PropertyLike>();
  for (const p of active) byId.set(String(p.id), p);
  for (const p of archived) byId.set(String(p.id), p);

  const payload = Array.from(byId.values());
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("properties_catalog").upsert(
    {
      id: "main",
      payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id", ignoreDuplicates: false }
  );

  if (error) {
    console.error("Backfill failed:", error.message);
    process.exit(1);
  }

  console.log(
    `Backfill from prod done: ${payload.length} listings (${active.length} active + ${archived.length} archived).`
  );
}

void main();
