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
}
