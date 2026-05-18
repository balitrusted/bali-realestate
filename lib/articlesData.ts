import { list, put } from "@vercel/blob";
import type { Article } from "@/types/article";
import { enrichArticlesWithUbudAreaGuides } from "@/lib/ubudAreaGuideArticles";

const BLOB_KEY = "data/articles.json";
const getBlobStoreBaseUrl = () => process.env.BLOB_STORE_URL?.trim().replace(/\/$/, "");

function clampFutureIso(iso?: string): string | undefined {
  if (!iso) return iso;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  const now = Date.now();
  if (t <= now) return iso;
  return new Date(now).toISOString();
}

function normalizeArticleDates(article: Article): Article {
  return {
    ...article,
    publishedAt: clampFutureIso(article.publishedAt),
    createdAt: clampFutureIso(article.createdAt) ?? article.createdAt,
    updatedAt: clampFutureIso(article.updatedAt) ?? article.updatedAt,
  };
}

/**
 * Raw array from Blob JSON only (no merge with bundled). Used after admin saves to verify writes.
 */
export async function readArticlesBlobRaw(): Promise<Article[] | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const baseUrl = getBlobStoreBaseUrl();
    const bust = (u: string) => `${u}${u.includes("?") ? "&" : "?"}t=${Date.now()}`;
    if (baseUrl) {
      const res = await fetch(bust(`${baseUrl}/${BLOB_KEY}`), {
        cache: "no-store",
        headers: { Pragma: "no-cache", "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data: unknown = await res.json();
        if (Array.isArray(data)) return (data as Article[]).map(normalizeArticleDates);
      }
    }
    const { blobs } = await list({ prefix: BLOB_KEY, limit: 1 });
    const match = blobs?.find((b) => b.pathname === BLOB_KEY);
    if (match?.url) {
      const res = await fetch(bust(match.url), {
        cache: "no-store",
        headers: { Pragma: "no-cache", "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data: unknown = await res.json();
        if (Array.isArray(data)) return (data as Article[]).map(normalizeArticleDates);
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Get articles: from Vercel Blob if present, else from bundled data/articles.
 */
export async function getArticles(): Promise<Article[]> {
  // Always load bundled data/articles.ts (it is part of the deployment and contains our manual fixes).
  const { articles: localArticlesRaw } = await import("@/data/articles");
  const localArticles = localArticlesRaw.map(normalizeArticleDates);

  // If Blob is enabled, merge Blob + bundled by freshness (updatedAt, fallback createdAt).
  // This prevents “why did my text change not show?” when Blob contains older data.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blobArticles = await readArticlesBlobRaw();

      if (blobArticles && Array.isArray(blobArticles) && blobArticles.length > 0) {
        const normalizedBlobArticles = blobArticles.map(normalizeArticleDates);
        const score = (a: Article) => {
          const updated = a.updatedAt ? Date.parse(a.updatedAt) : NaN;
          const created = a.createdAt ? Date.parse(a.createdAt) : NaN;
          const t = Number.isFinite(updated) ? updated : Number.isFinite(created) ? created : 0;
          return t;
        };

        const byId = new Map<string, Article>();
        for (const a of localArticles) byId.set(a.id, a);
        for (const b of normalizedBlobArticles) {
          const existing = byId.get(b.id);
          if (!existing) {
            byId.set(b.id, b);
          } else {
            const chosen = score(b) > score(existing) ? b : existing;
            byId.set(b.id, chosen);
          }
        }

        return enrichArticlesWithUbudAreaGuides(
          Array.from(byId.values()).map(normalizeArticleDates)
        );
      }
    } catch {
      /* fall through to local */
    }
  }

  return enrichArticlesWithUbudAreaGuides(localArticles);
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
    cacheControlMaxAge: 0,
  });
}
