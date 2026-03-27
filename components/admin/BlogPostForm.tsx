"use client";

import { useState } from "react";
import type { BlogPost } from "@/types/blog";

interface BlogPostFormProps {
  post?: BlogPost;
  onSave: (payload: Record<string, unknown>) => void;
}

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const locations: { value: BlogPost["location"]; label: string }[] = [
  { value: "ubud", label: "Ubud" },
  { value: "sanur", label: "Sanur" },
  { value: "other", label: "Other" },
];

export default function BlogPostForm({ post, onSave }: BlogPostFormProps) {
  const [formData, setFormData] = useState({
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    summary: post?.summary ?? "",
    content: post?.content ?? "",
    location: post?.location ?? "ubud",
    tags: post?.tags?.join(", ") ?? "",
    author: post?.author ?? "Balitrusted Team",
    published: post?.published ?? true,
    publishedAt: post?.publishedAt ? toDatetimeLocalValue(post.publishedAt) : "",
    seoTitle: post?.seoTitle ?? "",
    seoDescription: post?.seoDescription ?? "",
    featuredImage: post?.featuredImage ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const publishedAtIso =
      formData.publishedAt && formData.publishedAt.length >= 10
        ? new Date(formData.publishedAt).toISOString()
        : post?.publishedAt || new Date().toISOString();

    onSave({
      ...(post ? { id: post.id, createdAt: post.createdAt } : {}),
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      summary: formData.summary.trim(),
      content: formData.content,
      location: formData.location,
      tags: formData.tags,
      author: formData.author.trim(),
      published: formData.published,
      publishedAt: publishedAtIso,
      seoTitle: formData.seoTitle.trim() || undefined,
      seoDescription: formData.seoDescription.trim() || undefined,
      featuredImage: formData.featuredImage.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6 bg-white rounded-lg border border-gray-200 p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-900 mb-1">Title</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Slug (URL)</label>
          <input
            type="text"
            required
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">/blog/{formData.slug || "…"}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Location tag</label>
          <select
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value as BlogPost["location"] })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {locations.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-900 mb-1">Summary (deck)</label>
          <textarea
            rows={3}
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-900 mb-1">Body (HTML)</label>
          <p className="text-xs text-gray-500 mb-1">
            Paste HTML from your draft. Use semantic tags: <code className="text-xs">&lt;p&gt;</code>,{" "}
            <code className="text-xs">&lt;h2&gt;</code>, <code className="text-xs">&lt;a href=&quot;/...&quot;&gt;</code>.
          </p>
          <textarea
            rows={18}
            required
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Tags (comma-separated)</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Author</label>
          <input
            type="text"
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Featured image URL (optional)</label>
          <input
            type="url"
            value={formData.featuredImage}
            onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Published date (local)</label>
          <input
            type="datetime-local"
            value={formData.publishedAt}
            onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="flex items-center gap-2 md:col-span-2">
          <input
            type="checkbox"
            id="published"
            checked={formData.published}
            onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
            className="rounded border-gray-300"
          />
          <label htmlFor="published" className="text-sm font-medium text-gray-900">
            Published (visible on /blog)
          </label>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-900 mb-1">SEO title (optional)</label>
          <input
            type="text"
            value={formData.seoTitle}
            onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-900 mb-1">SEO description (optional)</label>
          <textarea
            rows={2}
            value={formData.seoDescription}
            onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800">
          Save
        </button>
      </div>
    </form>
  );
}
