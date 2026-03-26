import Image from "next/image";
import Link from "next/link";
import { formatLocaleDate } from "@/lib/formatDate";
import { getBlogPosts } from "@/lib/blogData";
import { blogPreview, blogReadingMinutes } from "@/lib/blogHub";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Blog",
  description:
    "Fresh Bali content stream for Ubud, Sanur, and nearby areas: practical notes, market observations, and navigational guides.",
};

function PostMeta({
  publishedAt,
  updatedAt,
  readingMinutes,
}: {
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
}) {
  const dateLabel = updatedAt !== publishedAt ? `Updated ${formatLocaleDate(updatedAt)}` : formatLocaleDate(publishedAt);
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500">
      <span>{dateLabel}</span>
      <span className="text-stone-300">·</span>
      <span>{readingMinutes} min read</span>
    </div>
  );
}

export default async function BlogPage() {
  const posts = await getBlogPosts();
  const rows = [...posts].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  const featured = rows[0] ?? null;
  const rest = rows.slice(1);

  const byLocation = new Map<string, typeof rows>();
  for (const p of rows) {
    const key = p.location;
    if (!byLocation.has(key)) byLocation.set(key, []);
    byLocation.get(key)!.push(p);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
        <header className="mx-auto mb-10 max-w-3xl text-center md:mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800/90">Blog</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">Daily notes, local context</h1>
          <p className="mt-3 text-base leading-relaxed text-stone-600 md:text-lg">
            A high-frequency stream for SEO topics and real-world notes around Ubud, Sanur, and Bali living.
          </p>
          <p className="mt-4 text-sm text-stone-500">
            {rows.length} {rows.length === 1 ? "post" : "posts"}
          </p>
        </header>

        {rows.length === 0 ? (
          <section className="mx-auto max-w-3xl rounded-2xl border border-stone-200 bg-white px-6 py-12 text-center">
            <h2 className="text-xl font-semibold text-stone-900">Blog is ready</h2>
            <p className="mt-2 text-sm text-stone-600">
              Add your first post in <code>data/blog/index.ts</code>, then it will appear here automatically.
            </p>
          </section>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr),280px]">
            <div className="space-y-8">
              {featured ? (
                <article className="overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-md shadow-stone-200/40">
                  {featured.featuredImage ? (
                    <Link href={`/blog/${featured.slug}`} className="relative block aspect-[16/9] w-full bg-stone-100">
                      <Image src={featured.featuredImage} alt={featured.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 900px" />
                    </Link>
                  ) : null}
                  <div className="p-6 md:p-8">
                    <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">{featured.location}</p>
                    <h2 className="mt-3 text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">{featured.title}</h2>
                    <p className="mt-4 text-base leading-relaxed text-stone-700">{blogPreview(featured, 360)}</p>
                    <div className="mt-4">
                      <PostMeta
                        publishedAt={featured.publishedAt}
                        updatedAt={featured.updatedAt}
                        readingMinutes={blogReadingMinutes(featured.content)}
                      />
                    </div>
                    <div className="mt-6">
                      <Link
                        href={`/blog/${featured.slug}`}
                        className="inline-flex items-center justify-center rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900"
                      >
                        Read more
                      </Link>
                    </div>
                  </div>
                </article>
              ) : null}

              {rest.length > 0 ? (
                <section>
                  <h2 className="mb-4 text-xl font-semibold text-stone-900">More posts</h2>
                  <ul className="space-y-4">
                    {rest.map((post) => (
                      <li key={post.id}>
                        <article className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm transition hover:border-emerald-200">
                          <h3 className="text-lg font-semibold text-stone-900">
                            <Link href={`/blog/${post.slug}`} className="hover:text-emerald-900">
                              {post.title}
                            </Link>
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed text-stone-600">{blogPreview(post, 220)}</p>
                          <div className="mt-3">
                            <PostMeta
                              publishedAt={post.publishedAt}
                              updatedAt={post.updatedAt}
                              readingMinutes={blogReadingMinutes(post.content)}
                            />
                          </div>
                          <div className="mt-4">
                            <Link href={`/blog/${post.slug}`} className="text-sm font-medium text-emerald-800 hover:text-emerald-900">
                              Read more →
                            </Link>
                          </div>
                        </article>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>

            <aside className="h-fit rounded-2xl border border-stone-200/90 bg-white p-4 lg:sticky lg:top-24">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-600">All links</h2>
              <div className="mt-4 space-y-5">
                {Array.from(byLocation.entries()).map(([location, list]) => (
                  <div key={location}>
                    <h3 className="text-sm font-semibold text-stone-900 capitalize">{location}</h3>
                    <ul className="mt-2 space-y-2">
                      {list.slice(0, 14).map((post) => (
                        <li key={post.id}>
                          <Link href={`/blog/${post.slug}`} className="text-sm text-stone-600 hover:text-emerald-900">
                            {post.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
