export interface Article {
  id: string;
  title: string;
  slug: string;
  category: string; // e.g., "ubud", "legal", "investment"
  content: string; // HTML content
  excerpt?: string; // Short description for preview
  featuredImage?: string; // URL to featured image
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
  createdAt: string;
  updatedAt?: string;
  // Voting
  upvotes?: number;
  downvotes?: number;
  userVotes?: { [ipOrId: string]: 'up' | 'down' }; // Track votes by IP or user ID
}
