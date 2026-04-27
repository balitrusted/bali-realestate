import { loadEnvConfig } from "@next/env";
import { loadFullPropertyList, normalizePropertyListForPersistence } from "../lib/propertiesStorage";
import { getSupabaseServerClient, isSupabaseConfigured } from "../lib/supabaseServer";

loadEnvConfig(process.cwd());

async function main() {
  if (!isSupabaseConfigured()) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const previousMode = process.env.PROPERTIES_ROLLOUT_MODE;
  process.env.PROPERTIES_ROLLOUT_MODE = "blob";
  const list = await loadFullPropertyList();
  process.env.PROPERTIES_ROLLOUT_MODE = previousMode;

  const normalized = normalizePropertyListForPersistence(list);
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("properties_catalog").upsert(
    {
      id: "main",
      payload: normalized,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id", ignoreDuplicates: false }
  );

  if (error) {
    console.error("Backfill failed:", error.message);
    process.exit(1);
  }

  console.log(`Backfill done: properties catalog row updated (${normalized.length} listings).`);
}

void main();
