import { list, put } from "@vercel/blob";
import type { BlogPost } from "@/types/blog";

const BLOB_KEY = "data/blog.json";

function getBlobStoreBaseUrl(): string | undefined {
  return process.env.BLOB_STORE_URL?.trim().replace(/\/$/, "");
}

function clampFutureIso(iso?: string): string | undefined {
  if (!iso) return iso;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  const now = Date.now();
  if (t <= now) return iso;
  return new Date(now).toISOString();
}

function normalizeBlogPost(p: BlogPost): BlogPost {
  return {
    ...p,
    publishedAt: clampFutureIso(p.publishedAt) ?? p.publishedAt,
    createdAt: clampFutureIso(p.createdAt) ?? p.createdAt,
    updatedAt: clampFutureIso(p.updatedAt) ?? p.updatedAt,
  };
}

async function fetchBlobPosts(): Promise<BlogPost[] | null> {
  const baseUrl = getBlobStoreBaseUrl();
  if (baseUrl) {
    const res = await fetch(`${baseUrl}/${BLOB_KEY}`, { cache: "no-store" });
    if (res.ok) {
      const data: unknown = await res.json();
      if (Array.isArray(data)) return data as BlogPost[];
    }
  }
  const { blobs } = await list({ prefix: BLOB_KEY, limit: 5 });
  const match = blobs?.find((b) => b.pathname === BLOB_KEY);
  if (match?.url) {
    const res = await fetch(match.url, { cache: "no-store" });
    if (res.ok) {
      const data: unknown = await res.json();
      if (Array.isArray(data)) return data as BlogPost[];
    }
  }
  return null;
}

/**
 * All blog posts (published and not) for admin + merge with Blob on Vercel.
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const { blogPosts: localPosts } = await import("@/data/blog");
  const local = localPosts.map(normalizeBlogPost);

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return local;
  }

  try {
    const blobPosts = await fetchBlobPosts();
    if (blobPosts && blobPosts.length > 0) {
      const normalizedBlob = blobPosts.map(normalizeBlogPost);
      const score = (p: BlogPost) => {
        const u = p.updatedAt ? Date.parse(p.updatedAt) : NaN;
        const c = p.createdAt ? Date.parse(p.createdAt) : NaN;
        return Number.isFinite(u) ? u : Number.isFinite(c) ? c : 0;
      };
      const byId = new Map<string, BlogPost>();
      for (const p of local) byId.set(p.id, p);
      for (const b of normalizedBlob) {
        const ex = byId.get(b.id);
        if (!ex) {
          byId.set(b.id, b);
        } else {
          byId.set(b.id, score(b) > score(ex) ? b : ex);
        }
      }
      return Array.from(byId.values()).map(normalizeBlogPost);
    }
  } catch {
    /* use bundled */
  }

  return local;
}

export async function saveBlogPostsToBlob(posts: BlogPost[]): Promise<void> {
  await put(BLOB_KEY, JSON.stringify(posts), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}
