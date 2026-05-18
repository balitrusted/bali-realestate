import { notFound } from "next/navigation";
import Link from "next/link";
import { Article } from "@/types/article";
import { getArticles } from "@/lib/articlesData";
import {
  GUIDE_CATEGORIES,
  UBUD_HUB_OVERVIEW_SLUG,
  articlePreview,
  articleReadingMinutes,
  commentCountForArticle,
  getApprovedCommentCountsByArticleId,
  isUbudAreaGuideArticle,
  publishedArticles,
} from "@/lib/guideHub";
import { UBUD_AREA_GUIDE_SUBAREAS_ORDER } from "@/lib/ubudAreaGuideArticles";
import { subAreaNames } from "@/types/areas";
import { formatLocaleDate } from "@/lib/formatDate";

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

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const categoryInfo = GUIDE_CATEGORIES.find((c) => c.slug === category);

  if (!categoryInfo) {
    notFound();
  }

  const [articles, commentMap] = await Promise.all([getArticlesByCategory(category), getApprovedCommentCountsByArticleId()]);

  const sorted = [...articles].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  const areaGuides =
    category === "ubud"
      ? sorted.filter(isUbudAreaGuideArticle)
      : [];
  const otherArticles =
    category === "ubud"
      ? sorted.filter((a) => !isUbudAreaGuideArticle(a))
      : sorted;
  const rows = otherArticles;

  const ubudNeighborhoodLinks =
    category === "ubud"
      ? UBUD_AREA_GUIDE_SUBAREAS_ORDER.map((subArea) => {
          const slug = `${subArea}-area-guide-ubud`;
          const article = areaGuides.find((a) => a.slug === slug);
          if (!article) return null;
          return {
            subArea,
            name: subAreaNames[subArea],
            href: `/guides/ubud/${slug}`,
          };
        }).filter((x): x is NonNullable<typeof x> => x !== null)
      : [];

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
            {articles.length} {articles.length === 1 ? "article" : "articles"}
            {category === "ubud" && ubudNeighborhoodLinks.length > 0 ? (
              <span className="text-stone-400">
                {" "}
                · {ubudNeighborhoodLinks.length} neighborhood guides
              </span>
            ) : null}
          </p>
        </div>

        {category === "ubud" && ubudNeighborhoodLinks.length > 0 ? (
          <nav
            className="mb-10 rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-5"
            aria-label="Ubud neighborhood guides"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">Neighborhoods</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {ubudNeighborhoodLinks.map(({ subArea, name, href }) => (
                <li key={subArea}>
                  <Link
                    href={href}
                    className="inline-flex rounded-full border border-stone-200/90 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 transition hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <Link
                href={`/guides/ubud/${UBUD_HUB_OVERVIEW_SLUG}`}
                className="font-medium text-emerald-800 hover:text-emerald-900"
              >
                Ubud areas overview →
              </Link>
              <Link href="/properties/rent/ubud" className="font-medium text-stone-600 hover:text-emerald-900">
                Villas for rent →
              </Link>
            </div>
          </nav>
        ) : null}

        {articles.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white px-6 py-12 text-center">
            <p className="text-stone-600">No published articles in this topic yet.</p>
            <Link href="/guides" className="mt-4 inline-block text-sm font-medium text-emerald-800 hover:text-emerald-900">
              Back to all guides
            </Link>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white px-6 py-8 text-center">
            <p className="text-stone-600">Open a neighborhood guide above, or check back for more Ubud articles.</p>
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
                  ? `Updated ${formatLocaleDate(article.updatedAt)}`
                  : article.publishedAt
                    ? formatLocaleDate(article.publishedAt)
                    : formatLocaleDate(article.createdAt);

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
