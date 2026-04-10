import { join } from "path";
import { writeFile } from "fs/promises";
import { list, put } from "@vercel/blob";
import type { Comment } from "@/types/article";

const BLOB_KEY = "data/comments.json";
const DATA_FILE = join(process.cwd(), "data", "comments.ts");

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

async function fetchBlobComments(): Promise<Comment[] | null> {
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

/**
 * Bundled `data/comments.ts` merged with Blob when `BLOB_READ_WRITE_TOKEN` is set (Vercel).
 */
export async function getAllComments(): Promise<Comment[]> {
  const { comments: local } = await import("@/data/comments");

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return [...local];
  }

  try {
    const blobComments = await fetchBlobComments();
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
 * Persist full comment list: Vercel Blob in production, `data/comments.ts` locally.
 */
export async function persistComments(comments: Comment[]): Promise<void> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await put(BLOB_KEY, JSON.stringify(comments), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });
    return;
  }

  await writeFile(DATA_FILE, generateCommentsFile(comments), "utf-8");
}
