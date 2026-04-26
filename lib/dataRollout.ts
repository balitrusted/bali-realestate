export type RolloutMode = "blob" | "dual-write" | "supabase";

function normalizeMode(value: string | undefined): RolloutMode {
  const mode = value?.trim().toLowerCase();
  if (mode === "dual-write") return "dual-write";
  if (mode === "supabase") return "supabase";
  return "blob";
}

export function getSearchQueryLogsRolloutMode(): RolloutMode {
  return normalizeMode(process.env.SEARCH_QUERY_LOGS_ROLLOUT_MODE);
}
