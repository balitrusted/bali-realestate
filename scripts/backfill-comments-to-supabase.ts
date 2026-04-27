import { loadEnvConfig } from "@next/env";
import { getAllComments } from "../lib/commentsPersistence";
import { getSupabaseServerClient, isSupabaseConfigured } from "../lib/supabaseServer";

loadEnvConfig(process.cwd());

function mapCommentToRow(comment: Awaited<ReturnType<typeof getAllComments>>[number]) {
  return {
    id: comment.id,
    article_id: comment.articleId,
    parent_id: comment.parentId ?? null,
    author_name: comment.authorName,
    author_email: comment.authorEmail,
    author_website: comment.authorWebsite ?? null,
    content: comment.content,
    approved: comment.approved,
    moderation_status: comment.moderationStatus ?? (comment.approved ? "approved" : "pending"),
    created_at: comment.createdAt,
    updated_at: comment.updatedAt ?? null,
    upvotes: comment.upvotes ?? 0,
    downvotes: comment.downvotes ?? 0,
    user_votes: comment.userVotes ?? {},
  };
}

async function main() {
  if (!isSupabaseConfigured()) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const previousMode = process.env.COMMENTS_ROLLOUT_MODE;
  process.env.COMMENTS_ROLLOUT_MODE = "blob";
  const comments = await getAllComments();
  process.env.COMMENTS_ROLLOUT_MODE = previousMode;

  const byId = new Map<string, ReturnType<typeof mapCommentToRow>>();
  for (const c of comments) byId.set(c.id, mapCommentToRow(c));
  const payload = Array.from(byId.values());
  const duplicatesRemoved = comments.length - payload.length;

  const supabase = getSupabaseServerClient();
  const { error: upsertError } = await supabase
    .from("comments")
    .upsert(payload, { onConflict: "id", ignoreDuplicates: false });
  if (upsertError) {
    console.error("Backfill failed:", upsertError.message);
    process.exit(1);
  }

  const { data: existing, error: readError } = await supabase.from("comments").select("id");
  if (readError) {
    console.error("Read-after-write failed:", readError.message);
    process.exit(1);
  }
  const keep = new Set(payload.map((r) => r.id));
  const staleIds =
    ((existing as Array<{ id: string }> | null) ?? [])
      .map((r) => r.id)
      .filter((id) => !keep.has(id));
  if (staleIds.length > 0) {
    const { error: deleteError } = await supabase.from("comments").delete().in("id", staleIds);
    if (deleteError) {
      console.error("Stale cleanup failed:", deleteError.message);
      process.exit(1);
    }
  }

  console.log(
    `Backfill done: ${payload.length} unique rows upserted (removed duplicates: ${duplicatesRemoved}, removed stale: ${staleIds.length}).`
  );
}

void main();
