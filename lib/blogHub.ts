import type { BlogPost } from "@/types/blog";

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function blogReadingMinutes(content: string): number {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function blogPreview(post: BlogPost, maxLen = 170): string {
  const base = post.summary?.trim() ? post.summary : stripHtml(post.content);
  if (base.length <= maxLen) return base;
  return `${base.slice(0, maxLen).trim()}…`;
}
