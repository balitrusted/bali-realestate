import { notFound } from "next/navigation";
import Link from "next/link";
import ArticleContent from "@/components/ArticleContent";
import ArticleComments from "@/components/ArticleComments";
import { getGlossaryTermBySlug, getGlossaryTerms } from "@/lib/glossaryData";
import { glossaryCategoryLabel } from "@/lib/glossaryHub";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://balitrusted.com";

function RelatedInlineLink({ href, label }: { href: string; label: string }) {
  const t = href.trim();
  if (!t) return null;
  const isAbs = /^https?:\/\//i.test(t);
  if (isAbs) {
    return (
      <a href={t} rel="noopener noreferrer" className="text-emerald-800 underline">
        {label}
      </a>
    );
  }
  const path = t.startsWith("/") ? t : `/${t}`;
  return (
    <Link href={path} className="text-emerald-800 underline">
      {label}
    </Link>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const term = await getGlossaryTermBySlug(slug);
  if (!term) return { title: "Term not found" };
  const canonical = `${baseUrl}/glossary/${term.slug}`;
  const title = term.seoTitle || `${term.title} | Balitrusted Glossary`;
  const description = term.seoDescription || term.summary;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
    },
  };
}

export default async function GlossaryTermPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [term, related] = await Promise.all([getGlossaryTermBySlug(slug), getGlossaryTerms()]);
  if (!term) notFound();

  const side = related.filter((t) => t.slug !== slug).slice(0, 36);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr),260px]">
          <div>
            <nav className="mb-8 text-sm text-gray-600">
              <Link href="/glossary" className="hover:text-gray-900">
                Glossary
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">{term.title}</span>
            </nav>

            <article className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 mb-2">
                {glossaryCategoryLabel(term.category)}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{term.title}</h1>
              <p className="text-gray-600 leading-relaxed mb-8">{term.summary}</p>
              <ArticleContent content={term.content} />
              {(term.relatedGuideUrl || term.relatedBlogUrl) && (
                <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm text-gray-800">
                  <span className="font-medium text-gray-900">See also: </span>
                  {term.relatedGuideUrl ? (
                    <>
                      <RelatedInlineLink href={term.relatedGuideUrl} label="Knowledge base" />
                      {term.relatedBlogUrl ? " · " : ""}
                    </>
                  ) : null}
                  {term.relatedBlogUrl ? (
                    <RelatedInlineLink href={term.relatedBlogUrl} label="Blog" />
                  ) : null}
                </div>
              )}
            </article>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <Link href="/glossary" className="text-gray-900 hover:text-gray-700 font-medium">
                ← Back to Glossary
              </Link>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200 max-w-3xl">
              <ArticleComments articleId={`glossary:${term.id}`} />
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-stone-200/90 bg-white p-4 lg:sticky lg:top-24">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-600">More terms</h2>
            <ul className="mt-4 space-y-2">
              {side.map((item) => (
                <li key={item.id}>
                  <Link href={`/glossary/${item.slug}`} className="text-sm text-stone-600 hover:text-emerald-900">
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
