import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ArticleContent from "@/components/ArticleContent";
import ArticleComments from "@/components/ArticleComments";
import { getBlogPosts } from "@/lib/blogData";
import { formatLocaleDate } from "@/lib/formatDate";
import { blogReadingMinutes } from "@/lib/blogHub";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function decodeAndStripHtml(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeForCompare(s: string): string {
  return decodeAndStripHtml(s)
    .toLowerCase()
    .replace(/[.,!?;:()[\]{}"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type ParagraphPick = { raw: string; normalized: string; idx: number };

function splitParagraphTexts(html: string): ParagraphPick[] {
  const parts = html.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi) || [];
  return parts
    .map((p, idx) => ({
      raw: decodeAndStripHtml(p),
      normalized: normalizeForCompare(p),
      idx,
    }))
    .filter((p) => p.raw.length > 0);
}

function scoreSummaryCandidate(raw: string, normalized: string, idx: number, total: number): number {
  let score = 0;
  const words = raw.split(/\s+/).length;
  if (words >= 10 && words <= 45) score += 3;
  if (words > 45) score += 1;

  // Intro should usually come from body, not first/last transitional paragraphs.
  if (idx > 0 && idx < total - 1) score += 2;
  if (idx === 0 || idx === total - 1) score -= 2;

  // Penalize transitional/opening connectors that read awkwardly as top summary.
  if (/^(another|also|and|but|because|this|that|in the end|finally|moreover|however)\b/i.test(raw)) {
    score -= 4;
  }
  if (/^(when people|at first|one of the first)\b/i.test(raw)) {
    score -= 2;
  }

  // Reward thesis-like signals (usually best as article lead summary).
  if (/\b(what most people|there is no single|in the end|depends|balance|the key|matters)\b/i.test(normalized)) {
    score += 5;
  }
  if (/\b(long-term|villa|ubud|lifestyle|experience)\b/i.test(normalized)) {
    score += 1;
  }
  return score;
}

function displaySummary(summary: string | undefined, html: string): string {
  const paragraphs = splitParagraphTexts(html);
  if (paragraphs.length === 0) return summary?.trim() || "";

  const firstParagraph = paragraphs[0].normalized;
  const current = normalizeForCompare(summary || "");

  // If summary is missing or duplicates the first paragraph, pick a paragraph from the middle.
  if (!current || firstParagraph.startsWith(current) || current.startsWith(firstParagraph)) {
    const ranked = paragraphs
      .map((p) => ({
        ...p,
        score: scoreSummaryCandidate(p.raw, p.normalized, p.idx, paragraphs.length),
      }))
      .sort((a, b) => b.score - a.score || a.idx - b.idx);
    return ranked[0]?.raw || summary?.trim() || "";
  }

  return summary!.trim();
}

async function getBlogPost(slug: string) {
  const posts = await getBlogPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Post Not Found" };
  const canonical = post.canonicalUrl || `/blog/${post.slug}`;
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.summary;
  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: post.ogTitle || title,
      description: post.ogDescription || description,
      type: "article",
      url: canonical,
      images: post.featuredImage ? [{ url: post.featuredImage }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, all] = await Promise.all([getBlogPost(slug), getBlogPosts()]);
  if (!post) notFound();

  const sideLinks = all
    .filter((p) => p.slug !== slug)
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 40);
  const summaryText = displaySummary(post.summary, post.content);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr),280px]">
          <div>
            <nav className="mb-8 text-sm text-gray-600">
              <Link href="/blog" className="hover:text-gray-900">
                Blog
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">{post.title}</span>
            </nav>

            <article className="max-w-3xl">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-8">
                <span>{post.author}</span>
                <span>•</span>
                <span>{formatLocaleDate(post.publishedAt)}</span>
                <span>•</span>
                <span>{blogReadingMinutes(post.content)} min read</span>
              </div>

              {post.featuredImage ? (
                <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
                  <Image src={post.featuredImage} alt={post.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
                </div>
              ) : null}

              {summaryText ? (
                <p className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-5 py-4 text-[1.05rem] leading-relaxed text-emerald-950">
                  {summaryText}
                </p>
              ) : null}
              <ArticleContent content={post.content} />
            </article>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <Link href="/blog" className="text-gray-900 hover:text-gray-700 font-medium">
                ← Back to Blog
              </Link>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200 max-w-3xl">
              <ArticleComments articleId={`blog:${post.id}`} />
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-stone-200/90 bg-white p-4 lg:sticky lg:top-24">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-600">All posts</h2>
            <ul className="mt-4 space-y-2">
              {sideLinks.map((item) => (
                <li key={item.id}>
                  <Link href={`/blog/${item.slug}`} className="text-sm text-stone-600 hover:text-emerald-900">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
