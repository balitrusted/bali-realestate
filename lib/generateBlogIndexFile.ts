import type { BlogPost } from "@/types/blog";

/** Regenerates `data/blog/index.ts` for local admin saves (no Blob token). */
export function generateBlogIndexFile(posts: BlogPost[]): string {
  const ind = "  ";
  let c = `import type { BlogPost } from "@/types/blog";\n\n`;
  c += `// Blog posts for SEO/content stream. Edited via /admin/blog or this file.\n`;
  c += `// On Vercel, runtime reads may merge in newer data from Blob (see lib/blogPostsPersistence.ts).\n`;
  c += `export const blogPosts: BlogPost[] = [\n`;
  posts.forEach((p, i) => {
    c += `${ind}{\n`;
    c += `${ind}${ind}id: ${JSON.stringify(p.id)},\n`;
    c += `${ind}${ind}slug: ${JSON.stringify(p.slug)},\n`;
    c += `${ind}${ind}title: ${JSON.stringify(p.title)},\n`;
    c += `${ind}${ind}summary: ${JSON.stringify(p.summary)},\n`;
    c += `${ind}${ind}content: ${JSON.stringify(p.content)},\n`;
    c += `${ind}${ind}location: ${JSON.stringify(p.location)},\n`;
    c += `${ind}${ind}tags: [${p.tags.map((t) => JSON.stringify(t)).join(", ")}],\n`;
    c += `${ind}${ind}author: ${JSON.stringify(p.author)},\n`;
    if (p.featuredImage) {
      c += `${ind}${ind}featuredImage: ${JSON.stringify(p.featuredImage)},\n`;
    }
    c += `${ind}${ind}published: ${p.published},\n`;
    c += `${ind}${ind}publishedAt: ${JSON.stringify(p.publishedAt)},\n`;
    c += `${ind}${ind}createdAt: ${JSON.stringify(p.createdAt)},\n`;
    c += `${ind}${ind}updatedAt: ${JSON.stringify(p.updatedAt)},\n`;
    if (p.seoTitle) {
      c += `${ind}${ind}seoTitle: ${JSON.stringify(p.seoTitle)},\n`;
    }
    if (p.seoDescription) {
      c += `${ind}${ind}seoDescription: ${JSON.stringify(p.seoDescription)},\n`;
    }
    if (p.ogTitle) {
      c += `${ind}${ind}ogTitle: ${JSON.stringify(p.ogTitle)},\n`;
    }
    if (p.ogDescription) {
      c += `${ind}${ind}ogDescription: ${JSON.stringify(p.ogDescription)},\n`;
    }
    if (p.canonicalUrl) {
      c += `${ind}${ind}canonicalUrl: ${JSON.stringify(p.canonicalUrl)},\n`;
    }
    if (p.introHighlight) {
      c += `${ind}${ind}introHighlight: ${JSON.stringify(p.introHighlight)},\n`;
    }
    if (p.ctaLabel) {
      c += `${ind}${ind}ctaLabel: ${JSON.stringify(p.ctaLabel)},\n`;
    }
    if (p.ctaUrl) {
      c += `${ind}${ind}ctaUrl: ${JSON.stringify(p.ctaUrl)},\n`;
    }
    c += `${ind}}${i < posts.length - 1 ? "," : ""}\n`;
  });
  c += `];\n`;
  return c;
}
