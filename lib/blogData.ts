import { getAllBlogPosts } from "@/lib/blogPostsPersistence";
import type { BlogPost } from "@/types/blog";

/** Public blog list (published only; future-dated updatedAt clamped). */
export async function getBlogPosts(): Promise<BlogPost[]> {
  const all = await getAllBlogPosts();
  const now = Date.now();
  return all
    .filter((p) => p.published)
    .map((p) => {
      const t = Date.parse(p.updatedAt);
      return Number.isFinite(t) && t > now ? { ...p, updatedAt: new Date(now).toISOString() } : p;
    });
}
