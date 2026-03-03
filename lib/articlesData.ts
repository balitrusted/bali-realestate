import { list, put } from "@vercel/blob";
import type { Article } from "@/types/article";

const BLOB_KEY = "data/articles.json";

/**
 * Get articles: from Vercel Blob if present, else from bundled data/articles.
 */
export async function getArticles(): Promise<Article[]> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { blobs } = await list({ prefix: BLOB_KEY, limit: 1 });
      const match = blobs?.find((b) => b.pathname === BLOB_KEY);
      if (match?.url) {
        const res = await fetch(match.url, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) return data as Article[];
        }
      }
    } catch {
      /* fall through */
    }
  }
  const { articles } = await import("@/data/articles");
  return articles;
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
