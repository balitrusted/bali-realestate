import { blogPosts } from "@/data/blog";
import type { BlogPost } from "@/types/blog";

export async function getBlogPosts(): Promise<BlogPost[]> {
  const now = Date.now();
  return blogPosts
    .filter((p) => p.published)
    .map((p) => {
      const t = Date.parse(p.updatedAt);
      return Number.isFinite(t) && t > now ? { ...p, updatedAt: new Date(now).toISOString() } : p;
    });
}
