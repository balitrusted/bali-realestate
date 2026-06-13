import type { SubArea } from "@/types/property";

export interface ArticleGalleryItem {
  src: string;
  alt: string;
  caption?: string;
}

export interface GuideMapPoi {
  id: string;
  label: string;
  lat: number;
  lng: number;
  note?: string;
  mapsUrl?: string;
}

export interface ArticleAreaMap {
  boundaryUrl: string;
  title?: string;
  caption?: string;
  /** Guide checkpoints (cafés, clubs, schools) - not listings */
  pois?: GuideMapPoi[];
  /** Future: catalog villa overlay on a separate map page */
  listingSubArea?: SubArea;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  category: string; // e.g., "ubud", "legal", "investment"
  content: string; // HTML content
  excerpt?: string; // Short description for preview
  featuredImage?: string; // URL to featured image
  /** Optional swipe carousel (area guides, photo essays) */
  gallery?: ArticleGalleryItem[];
  galleryTitle?: string;
  /** Second carousel — rendered before Noise section in area guides */
  galleryEnd?: ArticleGalleryItem[];
  galleryEndTitle?: string;
  areaMap?: ArticleAreaMap;
  images?: string[]; // Array of image URLs used in article
  tags: string[];
  author: string;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  // SEO fields
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  // Comments
  allowComments: boolean;
  commentCount?: number;
  // Statistics
  views?: number;
}

export interface Comment {
  id: string;
  articleId: string;
  parentId?: string; // For nested/reply comments
  authorName: string;
  authorEmail: string;
  authorWebsite?: string;
  content: string;
  approved: boolean; // Moderation
  moderationStatus?: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt?: string;
  // Voting
  upvotes?: number;
  downvotes?: number;
  userVotes?: { [ipOrId: string]: 'up' | 'down' }; // Track votes by IP or user ID
}
