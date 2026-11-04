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
    image: term?.image ?? "",
    imageAlt: term?.imageAlt ?? "",
    imageCaption: term?.imageCaption ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setUploadingImage(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload image");
      setFormData((p) => ({ ...p, image: data.url }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

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
    if (saving || uploadingImage) return;
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
        image: formData.image.trim(),
        imageAlt: formData.imageAlt.trim(),
        imageCaption: formData.imageCaption.trim(),
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
      <div className="space-y-3 rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-900">Illustration</p>
        {formData.image ? (
          <div className="flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={formData.image} alt="" className="h-28 w-auto max-w-[12rem] rounded-md border border-gray-200 object-cover" />
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, image: "" }))}
              className="text-sm text-red-700 hover:underline"
            >
              Remove image
            </button>
          </div>
        ) : null}
        <div>
          <input
            id="glossary-image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploadingImage || saving}
            className="hidden"
          />
          <label
            htmlFor="glossary-image-upload"
            className={`inline-block cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 ${uploadingImage ? "opacity-50" : ""}`}
          >
            {uploadingImage ? "Uploading..." : formData.image ? "Replace image" : "Upload image"}
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (or paste one)</label>
          <input
            type="text"
            value={formData.image}
            onChange={(e) => setFormData((p) => ({ ...p, image: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alt text (SEO, not shown)</label>
          <input
            type="text"
            placeholder="Wall-mounted split AC unit above a bed in a bright Ubud villa bedroom"
            value={formData.imageAlt}
            onChange={(e) => setFormData((p) => ({ ...p, imageAlt: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Caption (shown to visitors)</label>
          <input
            type="text"
            value={formData.imageCaption}
            onChange={(e) => setFormData((p) => ({ ...p, imageCaption: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
          />
        </div>
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
        disabled={saving || uploadingImage}
        className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? (term ? "Updating..." : "Creating...") : "Save"}
      </button>
    </form>
  );
}
