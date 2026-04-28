import type { Comment } from "@/types/article";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabaseServer";

const OBS_ENABLED = process.env.DATA_MIGRATION_OBSERVABILITY === "1";

type CommentRow = {
  id: string;
  article_id: string;
  parent_id: string | null;
  author_name: string;
  author_email: string;
  author_website: string | null;
  content: string;
  approved: boolean;
  moderation_status: "pending" | "approved" | "rejected" | null;
  created_at: string;
  updated_at: string | null;
  upvotes: number | null;
  downvotes: number | null;
  user_votes: Record<string, "up" | "down"> | null;
};

function reportMetric(
  event: string,
  details: Record<string, string | number | boolean | null | undefined>
): void {
  if (!OBS_ENABLED) return;
  console.info(`[comments] ${event}`, details);
}

function mapRowToComment(row: CommentRow): Comment {
  return {
    id: row.id,
    articleId: row.article_id,
    parentId: row.parent_id ?? undefined,
    authorName: row.author_name,
    authorEmail: row.author_email,
    authorWebsite: row.author_website ?? undefined,
    content: row.content,
    approved: row.approved,
    moderationStatus: row.moderation_status ?? (row.approved ? "approved" : "pending"),
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
    upvotes: row.upvotes ?? 0,
    downvotes: row.downvotes ?? 0,
    userVotes: row.user_votes ?? {},
  };
}

function mapCommentToRow(comment: Comment): CommentRow {
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

async function readCommentsFromSupabase(): Promise<Comment[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("comments")
      .select(
        "id,article_id,parent_id,author_name,author_email,author_website,content,approved,moderation_status,created_at,updated_at,upvotes,downvotes,user_votes"
      )
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[comments] Supabase read failed:", error.message);
      return null;
    }
    return ((data as CommentRow[] | null) ?? []).map(mapRowToComment);
  } catch (error) {
    console.error("[comments] Supabase read exception:", error);
    return null;
  }
}

/**
 * Bundled `data/comments.ts` merged with Blob when `BLOB_READ_WRITE_TOKEN` is set (Vercel).
 */
export async function getAllComments(): Promise<Comment[]> {
  const startedAt = Date.now();
  const supabaseComments = await readCommentsFromSupabase();
  if (!supabaseComments) {
    throw new Error("[comments] Supabase read failed");
  }
  reportMetric("read_ok", {
    mode: "supabase",
    source: "supabase",
    rows: supabaseComments.length,
    elapsedMs: Date.now() - startedAt,
  });
  return supabaseComments;
}

async function persistCommentsToSupabase(comments: Comment[]): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("[comments] Supabase is not configured");
  }
  const supabase = getSupabaseServerClient();
  const rows = comments.map(mapCommentToRow);
  const { error: upsertError } = await supabase
    .from("comments")
    .upsert(rows, { onConflict: "id", ignoreDuplicates: false });
  if (upsertError) {
    throw new Error(`[comments] Supabase upsert failed: ${upsertError.message}`);
  }
  const ids = new Set(comments.map((c) => c.id));
  const { data: existing, error: readError } = await supabase
    .from("comments")
    .select("id");
  if (readError) {
    throw new Error(`[comments] Supabase read-after-write failed: ${readError.message}`);
  }
  const staleIds =
    ((existing as Array<{ id: string }> | null) ?? [])
      .map((r) => r.id)
      .filter((id) => !ids.has(id));
  if (staleIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .in("id", staleIds);
    if (deleteError) {
      throw new Error(`[comments] Supabase stale cleanup failed: ${deleteError.message}`);
    }
  }
}

async function writeOneCommentToSupabase(comment: Comment): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("[comments] Supabase is not configured");
  }
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("comments")
    .upsert(mapCommentToRow(comment), { onConflict: "id", ignoreDuplicates: false });
  if (error) {
    throw new Error(`[comments] Supabase single write failed: ${error.message}`);
  }
}

/**
 * Persist full comment list: Blob/FS and optionally Supabase depending on rollout.
 */
export async function persistComments(comments: Comment[]): Promise<void> {
  const startedAt = Date.now();
  await persistCommentsToSupabase(comments);
  reportMetric("write_ok", { mode: "supabase", target: "supabase", elapsedMs: Date.now() - startedAt });
}

/** Serialize concurrent comment writes (public submit, votes, admin moderation). */
export async function mutateCommentsWithRetry(
  mutate: (draft: Comment[]) => Comment[] | Promise<Comment[]>
): Promise<Comment[]> {
  const before = await getAllComments();
  const next = await mutate([...before]);
  await persistComments(next);
  return next;
}

/** Fast path for comment creation to avoid full-table rewrite on Supabase mode. */
export async function addCommentFast(comment: Comment): Promise<void> {
  const startedAt = Date.now();
  await writeOneCommentToSupabase(comment);
  reportMetric("write_one_ok", { mode: "supabase", target: "supabase", elapsedMs: Date.now() - startedAt });
}
