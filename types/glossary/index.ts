export type GlossaryCategory = "legal" | "documents" | "living" | "finance" | "other";

export interface GlossaryTerm {
  id: string;
  slug: string;
  title: string;
  category: GlossaryCategory;
  /** Short plain-text blurb for the hub list. */
  summary: string;
  /** Article body (trusted HTML). */
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
  relatedGuideUrl?: string;
  relatedBlogUrl?: string;
}
