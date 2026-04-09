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

function BlogPostCta({ label, href }: { label: string; href: string }) {
  const trimmed = href.trim();
  const isAbsolute = /^https?:\/\//i.test(trimmed);
  const inner = isAbsolute ? (
    <a href={trimmed} rel="noopener noreferrer">
      {label}
    </a>
  ) : (
    <Link href={trimmed.startsWith("/") ? trimmed : `/${trimmed}`}>
      {label}
    </Link>
  );
  return (
    <div className="prose prose-article max-w-none mt-8">
      <p className="final-cta">{inner}</p>
    </div>
  );
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

  const introHighlight = post.introHighlight?.trim() ?? "";
  const ctaLabel = post.ctaLabel?.trim() ?? "";
  const ctaUrl = post.ctaUrl?.trim() ?? "";
  const showCta = Boolean(ctaLabel && ctaUrl);

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

              {introHighlight ? (
                <p className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-5 py-4 text-[1.05rem] leading-relaxed text-emerald-950">
                  {introHighlight}
                </p>
              ) : null}
              <ArticleContent content={post.content} />
              {showCta ? <BlogPostCta label={ctaLabel} href={ctaUrl} /> : null}
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
