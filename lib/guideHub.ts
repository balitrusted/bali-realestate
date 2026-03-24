import type { Article } from "@/types/article";

/** Ordered hub categories — keep in sync with routes `/guides/[slug]` */
export const GUIDE_CATEGORIES = [
  { slug: "rent", title: "Long-term rental", description: "Villa rentals, search tips, and what to watch for on the ground." },
  { slug: "buy", title: "Purchase & investments", description: "What you actually buy in Bali, leasehold vs freehold, and realistic expectations." },
  { slug: "land", title: "Land", description: "Risks, zoning, and opportunities before you commit to a plot." },
  { slug: "legal", title: "Legal & safety", description: "Contracts, scams to avoid, and how deals usually work in practice." },
  { slug: "ubud", title: "Ubud", description: "Neighborhoods, daily life, and how the area fits long-term stays." },
  { slug: "areas", title: "Other areas", description: "Canggu, Sanur, Seminyak, Uluwatu, and beyond — area-by-area notes." },
  { slug: "risks", title: "Mistakes & reality", description: "Expectations vs reality, common disappointments, and mindset." },
] as const;

export type GuideCategorySlug = (typeof GUIDE_CATEGORIES)[number]["slug"];

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function articleReadingMinutes(content: string): number {
  const text = stripHtml(content);
  const words = text.split(/\s+/).filter((w) => w.length > 0).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function articlePreview(article: Article, maxLen = 158): string {
  const raw = article.excerpt?.trim() ? article.excerpt : stripHtml(article.content);
  const one = raw.replace(/\s+/g, " ").trim();
  if (one.length <= maxLen) return one;
  return `${one.slice(0, maxLen).trim()}…`;
}

/** Approved comments per article (local `data/comments`; safe if file missing). */
export async function getApprovedCommentCountsByArticleId(): Promise<Map<string, number>> {
  try {
    const { comments } = await import("@/data/comments");
    const map = new Map<string, number>();
    for (const c of comments) {
      if (!c.approved) continue;
      map.set(c.articleId, (map.get(c.articleId) ?? 0) + 1);
    }
    return map;
  } catch {
    return new Map();
  }
}

export function commentCountForArticle(article: Article, fromData: Map<string, number>): number {
  const fromMap = fromData.get(article.id) ?? 0;
  const fromArticle = article.commentCount ?? 0;
  return Math.max(fromMap, fromArticle);
}

export function publishedArticles(articles: Article[]): Article[] {
  return articles.filter((a) => a.published);
}
