export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string; // HTML
  location: "ubud" | "sanur" | "other";
  tags: string[];
  author: string;
  featuredImage?: string;
  published: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalUrl?: string;
  /** Plain text green intro on the post page. Omit = no green box (only hub still uses summary). */
  introHighlight?: string;
  /** Optional end-of-article CTA; both label and URL required to render. */
  ctaLabel?: string;
  ctaUrl?: string;
}
