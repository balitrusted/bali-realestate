"use client";

import { useEffect, useState } from "react";
import type { GlossaryTerm } from "@/types/glossary";
import { GLOSSARY_CATEGORY_ORDER, glossaryCategoryLabel } from "@/lib/glossaryHub";

interface GlossaryTermFormProps {
  term?: GlossaryTerm;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
}

export default function GlossaryTermForm({ term, onSave }: GlossaryTermFormProps) {
  const [formData, setFormData] = useState({
    title: term?.title ?? "",
    slug: term?.slug ?? "",
    category: term?.category ?? "legal",
    summary: term?.summary ?? "",
    content: term?.content ?? "",
    published: term?.published ?? true,
    seoTitle: term?.seoTitle ?? "",
    seoDescription: term?.seoDescription ?? "",
    relatedGuideUrl: term?.relatedGuideUrl ?? "",
    relatedBlogUrl: term?.relatedBlogUrl ?? "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!term && formData.title) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, slug: prev.slug || slug }));
    }
  }, [term, formData.title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    try {
      setSaving(true);
      await onSave({
        title: formData.title,
        slug: formData.slug,
        category: formData.category,
        summary: formData.summary,
        content: formData.content,
        published: formData.published,
        seoTitle: formData.seoTitle || undefined,
        seoDescription: formData.seoDescription || undefined,
        relatedGuideUrl: formData.relatedGuideUrl || undefined,
        relatedBlogUrl: formData.relatedBlogUrl || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
        <input
          type="text"
          required
          value={formData.slug}
          onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm text-gray-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={formData.category}
          onChange={(e) =>
            setFormData((p) => ({ ...p, category: e.target.value as GlossaryTerm["category"] }))
          }
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
        >
          {GLOSSARY_CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>
              {glossaryCategoryLabel(c)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Summary (hub list)</label>
        <textarea
          required
          rows={3}
          value={formData.summary}
          onChange={(e) => setFormData((p) => ({ ...p, summary: e.target.value }))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Content (HTML)</label>
        <textarea
          required
          rows={14}
          value={formData.content}
          onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm text-gray-900"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="published"
          type="checkbox"
          checked={formData.published}
          onChange={(e) => setFormData((p) => ({ ...p, published: e.target.checked }))}
        />
        <label htmlFor="published" className="text-sm text-gray-800">
          Published
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">SEO title (optional)</label>
        <input
          type="text"
          value={formData.seoTitle}
          onChange={(e) => setFormData((p) => ({ ...p, seoTitle: e.target.value }))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">SEO description (optional)</label>
        <textarea
          rows={2}
          value={formData.seoDescription}
          onChange={(e) => setFormData((p) => ({ ...p, seoDescription: e.target.value }))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Related guide path (optional)</label>
        <input
          type="text"
          placeholder="/guides/legal"
          value={formData.relatedGuideUrl}
          onChange={(e) => setFormData((p) => ({ ...p, relatedGuideUrl: e.target.value }))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Related blog path (optional)</label>
        <input
          type="text"
          placeholder="/blog/..."
          value={formData.relatedBlogUrl}
          onChange={(e) => setFormData((p) => ({ ...p, relatedBlogUrl: e.target.value }))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? (term ? "Updating..." : "Creating...") : "Save"}
      </button>
    </form>
  );
}
