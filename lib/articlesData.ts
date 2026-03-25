import { list, put } from "@vercel/blob";
import type { Article } from "@/types/article";

const BLOB_KEY = "data/articles.json";
const getBlobStoreBaseUrl = () => process.env.BLOB_STORE_URL?.trim().replace(/\/$/, "");

/**
 * Get articles: from Vercel Blob if present, else from bundled data/articles.
 */
export async function getArticles(): Promise<Article[]> {
  // Always load bundled data/articles.ts (it is part of the deployment and contains our manual fixes).
  const { articles: localArticles } = await import("@/data/articles");

  // If Blob is enabled, merge Blob + bundled by freshness (updatedAt, fallback createdAt).
  // This prevents “why did my text change not show?” when Blob contains older data.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blobArticles = await (async (): Promise<Article[] | null> => {
        const baseUrl = getBlobStoreBaseUrl();

        // Prefer direct fetch (no list()) to avoid Advanced Requests.
        if (baseUrl) {
          const res = await fetch(`${baseUrl}/${BLOB_KEY}`, { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) return data as Article[];
          }
        }

        // Fallback: locate the blob URL via list() (only if base URL is missing).
        const { blobs } = await list({ prefix: BLOB_KEY, limit: 1 });
        const match = blobs?.find((b) => b.pathname === BLOB_KEY);
        if (match?.url) {
          const res = await fetch(match.url, { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) return data as Article[];
          }
        }

        return null;
      })();

      if (blobArticles && Array.isArray(blobArticles) && blobArticles.length > 0) {
        const score = (a: Article) => {
          const updated = a.updatedAt ? Date.parse(a.updatedAt) : NaN;
          const created = a.createdAt ? Date.parse(a.createdAt) : NaN;
          const t = Number.isFinite(updated) ? updated : Number.isFinite(created) ? created : 0;
          return t;
        };

        const byId = new Map<string, Article>();
        for (const a of localArticles) byId.set(a.id, a);
        for (const b of blobArticles) {
          const existing = byId.get(b.id);
          if (!existing) {
            byId.set(b.id, b);
          } else {
            const chosen = score(b) > score(existing) ? b : existing;
            byId.set(b.id, chosen);
          }
        }

        return Array.from(byId.values());
      }
    } catch {
      /* fall through to local */
    }
  }

  return localArticles;
}

/**
 * Save articles to Vercel Blob (when BLOB_READ_WRITE_TOKEN is set).
 * On Vercel this is the only writable storage; local dev can still use writeFile in the API.
 */
export async function saveArticlesToBlob(articles: Article[]): Promise<void> {
  await put(BLOB_KEY, JSON.stringify(articles), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}
