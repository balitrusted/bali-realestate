import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/types/article";
import { getArticles } from "@/lib/articlesData";
import {
  GUIDE_CATEGORIES,
  articlePreview,
  articleReadingMinutes,
  articleSpotlightTeaser,
  commentCountForArticle,
  getApprovedCommentCountsByArticleId,
  pickDailySpotlightArticle,
  publishedArticles,
  resolveArticleHeroImage,
} from "@/lib/guideHub";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Knowledge Base",
  description:
    "Practical guides on long-term rental, buying property, land, legal basics, Ubud, and other Bali areas — updated as we learn more.",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ArticleMeta({
  article,
  readingMinutes,
  views,
  comments,
}: {
  article: Article;
  readingMinutes: number;
  views: number;
  comments: number;
}) {
  const dateLabel =
    article.updatedAt && article.updatedAt !== article.createdAt
      ? `Updated ${formatDate(article.updatedAt)}`
      : article.publishedAt
        ? formatDate(article.publishedAt)
        : formatDate(article.createdAt);

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500">
      <span>{dateLabel}</span>
      <span className="text-stone-300" aria-hidden>
        ·
      </span>
      <span>{readingMinutes} min read</span>
      <span className="text-stone-300" aria-hidden>
        ·
      </span>
      <span>{views.toLocaleString()} reads</span>
      <span className="text-stone-300" aria-hidden>
        ·
      </span>
      <span>
        {comments === 0
          ? "No comments yet"
          : `${comments} comment${comments === 1 ? "" : "s"}`}
      </span>
    </div>
  );
}

function PostCard({
  article,
  href,
  readingMinutes,
  views,
  comments,
  excerpt,
  badge,
}: {
  article: Article;
  href: string;
  readingMinutes: number;
  views: number;
  comments: number;
  excerpt: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {badge ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-emerald-800">
            {badge}
          </span>
        ) : null}
      </div>
      <h3 className="text-lg font-semibold leading-snug text-stone-900 group-hover:text-emerald-900">{article.title}</h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-stone-600">{excerpt}</p>
      <div className="mt-4 border-t border-stone-100 pt-3">
        <ArticleMeta article={article} readingMinutes={readingMinutes} views={views} comments={comments} />
      </div>
    </Link>
  );
}

export default async function GuidesPage() {
  const [rawArticles, commentMap] = await Promise.all([getArticles(), getApprovedCommentCountsByArticleId()]);
  const all = publishedArticles(rawArticles);

  const enrich = (a: Article) => {
    const readingMinutes = articleReadingMinutes(a.content);
    const excerpt = articlePreview(a);
    const views = a.views ?? 0;
    const comments = commentCountForArticle(a, commentMap);
    const href = `/guides/${a.category}/${a.slug}`;
    return { article: a, readingMinutes, excerpt, views, comments, href };
  };

  const enriched = all.map(enrich);

  const daySeed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const spotlightArticle = pickDailySpotlightArticle(all, daySeed);
  const spotlightEnriched = spotlightArticle
    ? enriched.find((x) => x.article.id === spotlightArticle.id) ?? null
    : null;
  const spotlightHeroSrc = spotlightArticle ? resolveArticleHeroImage(spotlightArticle) : null;
  const spotlightTeaser = spotlightArticle ? articleSpotlightTeaser(spotlightArticle) : "";
  const spotlightCategoryTitle = spotlightArticle
    ? GUIDE_CATEGORIES.find((c) => c.slug === spotlightArticle.category)?.title ?? spotlightArticle.category
    : "";

  const enrichedForLists = spotlightArticle
    ? enriched.filter((x) => x.article.id !== spotlightArticle.id)
    : enriched;

  const listsByCategory = new Map<string, typeof enriched>();
  for (const cat of GUIDE_CATEGORIES) {
    listsByCategory.set(cat.slug, []);
  }
  const uncategorized: typeof enriched = [];
  for (const x of enriched) {
    const bucket = listsByCategory.get(x.article.category);
    if (bucket) bucket.push(x);
    else uncategorized.push(x);
  }
  for (const [, list] of listsByCategory) {
    list.sort((a, b) => +new Date(b.article.updatedAt) - +new Date(a.article.updatedAt));
  }

  const mostRead = [...enrichedForLists]
    .sort((a, b) => b.views - a.views || +new Date(b.article.updatedAt) - +new Date(a.article.updatedAt))
    .slice(0, 6);
  const mostReadIds = new Set(mostRead.map((x) => x.article.id));

  const recentlyUpdated = [...enrichedForLists]
    .filter((x) => !mostReadIds.has(x.article.id))
    .sort((a, b) => +new Date(b.article.updatedAt) - +new Date(a.article.updatedAt))
    .slice(0, 6);

  const hubFreshAt =
    all.length > 0
      ? new Date(Math.max(...all.map((a) => +new Date(a.updatedAt || a.createdAt)))).toISOString()
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
        <header className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800/90">Knowledge base</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">Guides that stay honest</h1>
          <p className="mt-3 text-base leading-relaxed text-stone-600 md:text-lg">
            Field notes and research on renting, buying, land, contracts, Ubud, and other areas — structured like a blog,
            organised so you can jump straight to what you need.
          </p>
          {hubFreshAt ? (
            <p className="mt-4 text-sm text-stone-500">
              Library last touched{" "}
              <time dateTime={hubFreshAt}>{formatDate(hubFreshAt)}</time>
              <span className="text-stone-400"> · </span>
              {all.length} {all.length === 1 ? "article" : "articles"}
            </p>
          ) : null}
        </header>

        <section className="mb-12 md:mb-16" aria-labelledby="topics-heading">
          <h2 id="topics-heading" className="sr-only">
            Browse by topic
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {GUIDE_CATEGORIES.map((cat) => {
              const n = listsByCategory.get(cat.slug)?.length ?? 0;
              return (
                <Link
                  key={cat.slug}
                  href={`/guides/${cat.slug}`}
                  className="flex flex-col rounded-2xl border border-stone-200/90 bg-white/90 p-4 shadow-sm transition hover:border-emerald-200 hover:bg-white"
                >
                  <span className="text-[13px] font-semibold text-stone-900">{cat.title}</span>
                  <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-500">{cat.description}</span>
                  <span className="mt-3 text-xs font-medium text-emerald-800">
                    {n === 0 ? "Open topic" : `${n} ${n === 1 ? "article" : "articles"}`}
                    <span className="text-emerald-600"> →</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {spotlightEnriched && spotlightArticle ? (
          <section
            className="mb-12 md:mb-16"
            aria-labelledby="spotlight-heading"
          >
            <div className="overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-md shadow-stone-200/40 md:flex md:min-h-[280px] md:flex-row-reverse">
              {spotlightHeroSrc ? (
                <Link
                  href={spotlightEnriched.href}
                  className="relative block aspect-[16/10] w-full shrink-0 overflow-hidden bg-stone-100 md:aspect-auto md:w-[min(44%,420px)] md:max-w-[420px]"
                  aria-label={`Open article: ${spotlightArticle.title}`}
                >
                  <Image
                    src={spotlightHeroSrc}
                    alt=""
                    fill
                    className="object-cover transition duration-300 hover:scale-[1.02]"
                    sizes="(max-width: 768px) 100vw, 420px"
                  />
                </Link>
              ) : null}
              <div className="flex flex-1 flex-col justify-center p-6 md:p-8 lg:p-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">
                  Featured today · {spotlightCategoryTitle}
                </p>
                <h2 id="spotlight-heading" className="mt-3 text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
                  <Link href={spotlightEnriched.href} className="hover:text-emerald-900">
                    {spotlightArticle.title}
                  </Link>
                </h2>
                <p className="mt-4 text-base leading-relaxed text-stone-700 md:text-[1.05rem]">{spotlightTeaser}</p>
                <div className="mt-4">
                  <ArticleMeta
                    article={spotlightArticle}
                    readingMinutes={spotlightEnriched.readingMinutes}
                    views={spotlightEnriched.views}
                    comments={spotlightEnriched.comments}
                  />
                </div>
                <div className="mt-6">
                  <Link
                    href={spotlightEnriched.href}
                    className="inline-flex items-center justify-center rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900"
                  >
                    Read full article
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mb-12 md:mb-16" aria-labelledby="popular-heading">
          <div className="mb-6 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 id="popular-heading" className="text-xl font-semibold text-stone-900 md:text-2xl">
                Most read
              </h2>
              <p className="text-sm text-stone-500">Ranked by views; newer edits break ties.</p>
            </div>
          </div>
          {mostRead.length === 0 ? (
            <p className="text-sm text-stone-500">No articles yet.</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {mostRead.map(({ article, readingMinutes, excerpt, views, comments, href }, i) => (
                <PostCard
                  key={article.id}
                  article={article}
                  href={href}
                  readingMinutes={readingMinutes}
                  views={views}
                  comments={comments}
                  excerpt={excerpt}
                  badge={i < 3 ? `#${i + 1}` : undefined}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mb-12 md:mb-16" aria-labelledby="fresh-heading">
          <div className="mb-6">
            <h2 id="fresh-heading" className="text-xl font-semibold text-stone-900 md:text-2xl">
              Recently updated
            </h2>
            <p className="text-sm text-stone-500">New material and revisions — outside the top reads above.</p>
          </div>
          {recentlyUpdated.length === 0 ? (
            <p className="text-sm text-stone-500">Nothing extra to show yet — check back after the next edits.</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {recentlyUpdated.map(({ article, readingMinutes, excerpt, views, comments, href }) => (
                <PostCard
                  key={article.id}
                  article={article}
                  href={href}
                  readingMinutes={readingMinutes}
                  views={views}
                  comments={comments}
                  excerpt={excerpt}
                />
              ))}
            </div>
          )}
        </section>

        <section className="border-t border-stone-200/80 pt-12 md:pt-16" aria-labelledby="by-topic-heading">
          <h2 id="by-topic-heading" className="text-xl font-semibold text-stone-900 md:text-2xl">
            By topic
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-stone-500">
            A few entry points per section — open the topic page for the full list.
          </p>

          <div className="mt-8 space-y-12">
            {GUIDE_CATEGORIES.map((cat) => {
              const full = listsByCategory.get(cat.slug) ?? [];
              const rows = full.slice(0, 3);
              const total = full.length;
              return (
                <div key={cat.slug}>
                  <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-lg font-semibold text-stone-900">{cat.title}</h3>
                    <Link
                      href={`/guides/${cat.slug}`}
                      className="text-sm font-medium text-emerald-800 hover:text-emerald-900"
                    >
                      {total === 0 ? "Topic hub →" : `View all ${total} ${total === 1 ? "articles" : "articles"} →`}
                    </Link>
                  </div>
                  {rows.length === 0 ? (
                    <p className="text-sm text-stone-500">Articles for this topic are on the way.</p>
                  ) : (
                    <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200/80 bg-white">
                      {rows.map(({ article, readingMinutes, views, comments, href, excerpt }) => (
                        <li key={article.id}>
                          <Link href={href} className="block px-4 py-4 transition hover:bg-stone-50/80 md:px-5">
                            <span className="font-medium text-stone-900 hover:text-emerald-900">{article.title}</span>
                            <p className="mt-1 line-clamp-2 text-sm text-stone-600">{excerpt}</p>
                            <div className="mt-2">
                              <ArticleMeta
                                article={article}
                                readingMinutes={readingMinutes}
                                views={views}
                                comments={comments}
                              />
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {uncategorized.length > 0 ? (
          <section className="mt-12 border-t border-stone-200/80 pt-12" aria-labelledby="other-heading">
            <h2 id="other-heading" className="text-lg font-semibold text-stone-900">
              More articles
            </h2>
            <p className="mt-1 text-sm text-stone-500">Not yet mapped to a hub category in the list above.</p>
            <ul className="mt-4 space-y-3">
              {uncategorized.map(({ article, href, excerpt }) => (
                <li key={article.id}>
                  <Link href={href} className="block rounded-xl border border-stone-200 bg-white px-4 py-3 hover:border-emerald-200">
                    <span className="font-medium text-stone-900">{article.title}</span>
                    <p className="mt-1 line-clamp-2 text-sm text-stone-600">{excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
