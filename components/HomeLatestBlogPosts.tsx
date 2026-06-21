import Link from "next/link";
import { formatLocaleDate } from "@/lib/formatDate";
import { blogPreview, blogReadingMinutes } from "@/lib/blogHub";
import type { BlogPost } from "@/types/blog";

interface HomeLatestBlogPostsProps {
  posts: BlogPost[];
}

export default function HomeLatestBlogPosts({ posts }: HomeLatestBlogPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className="py-8 border-t border-gray-100 bg-gray-50" aria-labelledby="home-latest-blog-heading">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
          <div>
            <h2 id="home-latest-blog-heading" className="text-[1.375rem] font-bold text-gray-900">
              Latest from the blog
            </h2>
            <p className="text-sm text-gray-600 mt-1 max-w-2xl">
              New articles about living, renting, and settling in Bali — updated on the blog as we publish them.
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-900 rounded-md hover:bg-white transition-colors text-sm font-medium whitespace-nowrap"
          >
            View all posts
          </Link>
        </div>

        <ul className="space-y-3">
          {posts.map((post) => {
            const dateLabel =
              post.updatedAt !== post.publishedAt
                ? `Updated ${formatLocaleDate(post.updatedAt)}`
                : formatLocaleDate(post.publishedAt);
            return (
              <li key={post.id}>
                <article className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 mb-1.5">
                    <span className="font-medium capitalize text-emerald-800">{post.location}</span>
                    <span className="text-gray-300">·</span>
                    <time dateTime={post.updatedAt}>{dateLabel}</time>
                    <span className="text-gray-300">·</span>
                    <span>{blogReadingMinutes(post.content)} min read</span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 leading-snug">
                    <Link href={`/blog/${post.slug}`} className="group-hover:text-emerald-900 hover:underline underline-offset-2">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-2">{blogPreview(post, 200)}</p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-3 inline-block text-sm font-medium text-gray-900 group-hover:underline"
                  >
                    Read article →
                  </Link>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
