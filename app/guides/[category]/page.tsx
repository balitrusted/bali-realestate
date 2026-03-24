import { notFound } from "next/navigation";
import Link from "next/link";
import { Article } from "@/types/article";
import { getArticles } from "@/lib/articlesData";
import {
  GUIDE_CATEGORIES,
  articlePreview,
  articleReadingMinutes,
  commentCountForArticle,
  getApprovedCommentCountsByArticleId,
  publishedArticles,
} from "@/lib/guideHub";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getArticlesByCategory(category: string): Promise<Article[]> {
  try {
    const articles = await getArticles();
    return publishedArticles(articles).filter((a) => a.category === category);
  } catch (error) {
    console.error("Error fetching articles:", error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const categoryInfo = GUIDE_CATEGORIES.find((c) => c.slug === category);

  if (!categoryInfo) {
    return { title: "Category Not Found" };
  }

  return {
    title: `${categoryInfo.title} - Knowledge Base`,
    description: categoryInfo.description,
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const categoryInfo = GUIDE_CATEGORIES.find((c) => c.slug === category);

  if (!categoryInfo) {
    notFound();
  }

  const [articles, commentMap] = await Promise.all([getArticlesByCategory(category), getApprovedCommentCountsByArticleId()]);

  const rows = [...articles].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      <div className="container mx-auto max-w-3xl px-4 py-10 md:py-12">
        <div className="mb-8">
          <Link href="/guides" className="text-sm font-medium text-emerald-800 hover:text-emerald-900">
            ← Knowledge base
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">{categoryInfo.title}</h1>
          <p className="mt-3 text-base leading-relaxed text-stone-600">{categoryInfo.description}</p>
          <p className="mt-2 text-sm text-stone-500">
            {rows.length} {rows.length === 1 ? "article" : "articles"}
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white px-6 py-12 text-center">
            <p className="text-stone-600">No published articles in this topic yet.</p>
            <Link href="/guides" className="mt-4 inline-block text-sm font-medium text-emerald-800 hover:text-emerald-900">
              Back to all guides
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {rows.map((article) => {
              const excerpt = articlePreview(article, 220);
              const readingMinutes = articleReadingMinutes(article.content);
              const views = article.views ?? 0;
              const comments = commentCountForArticle(article, commentMap);
              const dateLabel =
                article.updatedAt && article.updatedAt !== article.createdAt
                  ? `Updated ${formatDate(article.updatedAt)}`
                  : article.publishedAt
                    ? formatDate(article.publishedAt)
                    : formatDate(article.createdAt);

              return (
                <li key={article.id}>
                  <article className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm transition hover:border-emerald-200">
                    <Link href={`/guides/${category}/${article.slug}`} className="block group">
                      <h2 className="text-xl font-semibold text-stone-900 group-hover:text-emerald-900">{article.title}</h2>
                      {excerpt ? <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-600">{excerpt}</p> : null}
                      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500">
                        <span>{dateLabel}</span>
                        <span className="text-stone-300">·</span>
                        <span>{readingMinutes} min read</span>
                        <span className="text-stone-300">·</span>
                        <span>{views.toLocaleString()} reads</span>
                        <span className="text-stone-300">·</span>
                        <span>
                          {comments === 0
                            ? "No comments yet"
                            : `${comments} comment${comments === 1 ? "" : "s"}`}
                        </span>
                      </div>
                    </Link>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
