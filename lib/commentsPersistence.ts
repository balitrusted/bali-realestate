import { join } from "path";
import { writeFile } from "fs/promises";
import { list, put } from "@vercel/blob";
import type { Comment } from "@/types/article";
import { stableArraySignature, writeBlobJsonArrayWithRetry } from "@/lib/blobJsonOptimisticWrite";
import { getCommentsRolloutMode } from "@/lib/dataRollout";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabaseServer";

const BLOB_KEY = "data/comments.json";
const DATA_FILE = join(process.cwd(), "data", "comments.ts");
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

function getBlobStoreBaseUrl(): string | undefined {
  return process.env.BLOB_STORE_URL?.trim().replace(/\/$/, "");
}

function appendCacheBuster(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${Date.now()}`;
}

function commentRecencyScore(c: Comment): number {
  const u = c.updatedAt ? Date.parse(c.updatedAt) : NaN;
  const cr = c.createdAt ? Date.parse(c.createdAt) : NaN;
  return Number.isFinite(u) ? u : Number.isFinite(cr) ? cr : 0;
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

/** Generate `data/comments.ts` content for local dev (filesystem writes). */
export function generateCommentsFile(comments: Comment[]): string {
  const indent = "  ";
  let content = `import { Comment } from "@/types/article";\n\n`;
  content += `// Comments data\n`;
  content += `// This file is auto-generated. Manual edits may be overwritten.\n`;
  content += `export const comments: Comment[] = [\n`;

  comments.forEach((comment, index) => {
    content += `${indent}{\n`;
    content += `${indent}${indent}id: ${JSON.stringify(comment.id)},\n`;
    content += `${indent}${indent}articleId: ${JSON.stringify(comment.articleId)},\n`;
    if (comment.parentId) {
      content += `${indent}${indent}parentId: ${JSON.stringify(comment.parentId)},\n`;
    }
    content += `${indent}${indent}authorName: ${JSON.stringify(comment.authorName)},\n`;
    content += `${indent}${indent}authorEmail: ${JSON.stringify(comment.authorEmail)},\n`;
    if (comment.authorWebsite) {
      content += `${indent}${indent}authorWebsite: ${JSON.stringify(comment.authorWebsite)},\n`;
    }
    content += `${indent}${indent}content: ${JSON.stringify(comment.content)},\n`;
    content += `${indent}${indent}approved: ${comment.approved},\n`;
    if (comment.moderationStatus) {
      content += `${indent}${indent}moderationStatus: ${JSON.stringify(comment.moderationStatus)},\n`;
    }
    content += `${indent}${indent}createdAt: ${JSON.stringify(comment.createdAt)},\n`;
    if (comment.updatedAt) {
      content += `${indent}${indent}updatedAt: ${JSON.stringify(comment.updatedAt)},\n`;
    }
    if (comment.upvotes !== undefined) {
      content += `${indent}${indent}upvotes: ${comment.upvotes},\n`;
    }
    if (comment.downvotes !== undefined) {
      content += `${indent}${indent}downvotes: ${comment.downvotes},\n`;
    }
    if (comment.userVotes && Object.keys(comment.userVotes).length > 0) {
      content += `${indent}${indent}userVotes: ${JSON.stringify(comment.userVotes)},\n`;
    }
    content += `${indent}}${index < comments.length - 1 ? "," : ""}\n`;
  });

  content += `];\n`;
  return content;
}

/** Raw comments JSON from Blob (for verification after saves). */
export async function readCommentsFromBlobRaw(): Promise<Comment[] | null> {
  const baseUrl = getBlobStoreBaseUrl();
  if (baseUrl) {
    const res = await fetch(appendCacheBuster(`${baseUrl}/${BLOB_KEY}`), { cache: "no-store" });
    if (res.ok) {
      const data: unknown = await res.json();
      if (Array.isArray(data)) return data as Comment[];
    }
  }
  const { blobs } = await list({ prefix: BLOB_KEY, limit: 5 });
  const match = blobs?.find((b) => b.pathname === BLOB_KEY);
  if (match?.url) {
    const res = await fetch(appendCacheBuster(match.url), { cache: "no-store" });
    if (res.ok) {
      const data: unknown = await res.json();
      if (Array.isArray(data)) return data as Comment[];
    }
  }
  return null;
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

async function readCommentsFromBlobOrBundled(): Promise<Comment[]> {
  const { comments: local } = await import("@/data/comments");
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return [...local];
  }
  try {
    const blobComments = await readCommentsFromBlobRaw();
    if (blobComments && blobComments.length > 0) {
      const byId = new Map<string, Comment>();
      const score = commentRecencyScore;
      for (const c of local) {
        byId.set(c.id, c);
      }
      for (const b of blobComments) {
        const ex = byId.get(b.id);
        if (!ex) {
          byId.set(b.id, b);
        } else {
          byId.set(b.id, score(b) > score(ex) ? b : ex);
        }
      }
      return Array.from(byId.values());
    }
  } catch {
    /* use bundled */
  }
  return [...local];
}

/**
 * Bundled `data/comments.ts` merged with Blob when `BLOB_READ_WRITE_TOKEN` is set (Vercel).
 */
export async function getAllComments(): Promise<Comment[]> {
  const mode = getCommentsRolloutMode();
  const startedAt = Date.now();
  if (mode === "supabase") {
    const supabaseComments = await readCommentsFromSupabase();
    if (supabaseComments) {
      reportMetric("read_ok", {
        mode,
        source: "supabase",
        rows: supabaseComments.length,
        elapsedMs: Date.now() - startedAt,
      });
      return supabaseComments;
    }
    const fallback = await readCommentsFromBlobOrBundled();
    reportMetric("read_fallback", {
      mode,
      source: "blob_or_bundled",
      rows: fallback.length,
      elapsedMs: Date.now() - startedAt,
    });
    return fallback;
  }
  const rows = await readCommentsFromBlobOrBundled();
  reportMetric("read_ok", {
    mode,
    source: "blob_or_bundled",
    rows: rows.length,
    elapsedMs: Date.now() - startedAt,
  });
  return rows;
}

async function persistCommentsToBlobOrDisk(comments: Comment[]): Promise<void> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await put(BLOB_KEY, JSON.stringify(comments), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      cacheControlMaxAge: 0,
    });
    return;
  }
  await writeFile(DATA_FILE, generateCommentsFile(comments), "utf-8");
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
  const mode = getCommentsRolloutMode();
  const startedAt = Date.now();

  if (mode === "blob") {
    await persistCommentsToBlobOrDisk(comments);
    reportMetric("write_ok", {
      mode,
      target: process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "disk",
      elapsedMs: Date.now() - startedAt,
    });
    return;
  }

  if (mode === "dual-write") {
    await persistCommentsToBlobOrDisk(comments);
    try {
      await persistCommentsToSupabase(comments);
      reportMetric("write_ok", { mode, target: "supabase", elapsedMs: Date.now() - startedAt });
    } catch (error) {
      console.error("[comments] dual-write Supabase write failed:", error);
      reportMetric("write_error", { mode, target: "supabase", elapsedMs: Date.now() - startedAt });
    }
    return;
  }

  try {
    await persistCommentsToSupabase(comments);
    reportMetric("write_ok", { mode, target: "supabase", elapsedMs: Date.now() - startedAt });
  } catch (error) {
    console.error("[comments] Supabase write failed, fallback to Blob/FS:", error);
    await persistCommentsToBlobOrDisk(comments);
    reportMetric("write_fallback", {
      mode,
      target: process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "disk",
      elapsedMs: Date.now() - startedAt,
    });
  }
}

const verifyCommentsBlobWrite = process.env.BLOB_READ_WRITE_TOKEN
  ? async (written: Comment[]) => {
      const blob = await readCommentsFromBlobRaw();
      return blob !== null && stableArraySignature(blob) === stableArraySignature(written);
    }
  : undefined;

/** Serialize concurrent comment writes (public submit, votes, admin moderation). */
export async function mutateCommentsWithRetry(
  mutate: (draft: Comment[]) => Comment[] | Promise<Comment[]>
): Promise<Comment[]> {
  return writeBlobJsonArrayWithRetry({
    read: getAllComments,
    write: persistComments,
    verifyAfterWrite:
      getCommentsRolloutMode() === "blob" || getCommentsRolloutMode() === "dual-write"
        ? verifyCommentsBlobWrite
        : undefined,
    mutate,
  });
}

/** Fast path for comment creation to avoid full-table rewrite on Supabase mode. */
export async function addCommentFast(comment: Comment): Promise<void> {
  const mode = getCommentsRolloutMode();
  const startedAt = Date.now();

  if (mode === "supabase") {
    try {
      await writeOneCommentToSupabase(comment);
      reportMetric("write_one_ok", { mode, target: "supabase", elapsedMs: Date.now() - startedAt });
      return;
    } catch (error) {
      console.error("[comments] Supabase single write failed, fallback to full-write:", error);
      const rows = await getAllComments();
      await persistComments([...rows, comment]);
      reportMetric("write_one_fallback", { mode, target: "full_write", elapsedMs: Date.now() - startedAt });
      return;
    }
  }

  await mutateCommentsWithRetry((existing) => [...existing, comment]);
  reportMetric("write_one_ok", { mode, target: "blob_or_dual", elapsedMs: Date.now() - startedAt });
}
