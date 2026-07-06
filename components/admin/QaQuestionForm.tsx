"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { QaQuestion } from "@/types/qa";
import { QA_CATEGORY_ORDER, qaCategoryLabel, slugifyQaTitle } from "@/lib/qaHub";
import { VIRTUAL_AUTHOR_NAMES } from "@/data/qa/virtualAuthors";

interface QaQuestionFormProps {
  question?: QaQuestion;
  onSave?: (q: QaQuestion) => void;
}

export default function QaQuestionForm({ question, onSave }: QaQuestionFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(question?.title || "");
  const [slug, setSlug] = useState(question?.slug || "");
  const [body, setBody] = useState(question?.body || "");
  const [category, setCategory] = useState(question?.category || "rent");
  const [authorDisplayName, setAuthorDisplayName] = useState(
    question?.authorDisplayName || VIRTUAL_AUTHOR_NAMES[0]
  );
  const [published, setPublished] = useState(question?.status === "published");
  const [isSeeded, setIsSeeded] = useState(question?.isSeeded ?? true);
  const [seoTitle, setSeoTitle] = useState(question?.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(question?.seoDescription || "");
  const [relatedArea, setRelatedArea] = useState(question?.relatedArea || "");
  const [relatedServiceId, setRelatedServiceId] = useState(question?.relatedServiceId || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pickRandomAuthor = () => {
    const name = VIRTUAL_AUTHOR_NAMES[Math.floor(Math.random() * VIRTUAL_AUTHOR_NAMES.length)];
    setAuthorDisplayName(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        id: question?.id,
        title: title.trim(),
        slug: slug.trim() || slugifyQaTitle(title),
        body: body.trim(),
        category,
        authorKind: "virtual",
        authorDisplayName: authorDisplayName.trim(),
        published,
        isSeeded,
        seoTitle: seoTitle.trim(),
        seoDescription: seoDescription.trim(),
        relatedArea: relatedArea.trim(),
        relatedServiceId: relatedServiceId.trim(),
        createdAt: question?.createdAt,
        publishedAt: question?.publishedAt,
        answerCount: question?.answerCount,
      };
      const res = await fetch("/api/admin/qa", {
        method: question ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Save failed");
        return;
      }
      onSave?.(data.question);
      router.push(`/admin/qa/edit/${encodeURIComponent(data.question.id)}`);
      router.refresh();
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      {question?.authorEmail ? (
        <p className="text-sm text-gray-600 p-3 bg-amber-50 border border-amber-100 rounded-md">
          Submitter email (moderation only):{" "}
          <a href={`mailto:${question.authorEmail}`} className="font-medium text-gray-900">
            {question.authorEmail}
          </a>
        </p>
      ) : null}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Question title</label>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!question && !slug) setSlug(slugifyQaTitle(e.target.value));
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Slug</label>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md font-mono text-sm"
          placeholder="auto from title"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Extra detail (optional)</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as QaQuestion["category"])}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          >
            {QA_CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>
                {qaCategoryLabel(c)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Virtual author (display only)
          </label>
          <div className="flex gap-2">
            <input
              value={authorDisplayName}
              onChange={(e) => setAuthorDisplayName(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
              required
            />
            <button
              type="button"
              onClick={pickRandomAuthor}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              Random
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isSeeded} onChange={(e) => setIsSeeded(e.target.checked)} />
          Seeded / virtual
        </label>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer font-medium text-gray-900">SEO &amp; links</summary>
        <div className="mt-3 space-y-3 pl-1">
          <input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            placeholder="SEO title override"
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
          <textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            placeholder="Meta description"
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
          <input
            value={relatedArea}
            onChange={(e) => setRelatedArea(e.target.value)}
            placeholder="Related area (e.g. ubud)"
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
          <input
            value={relatedServiceId}
            onChange={(e) => setRelatedServiceId(e.target.value)}
            placeholder="Related service id"
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </details>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
      >
        {saving ? "Saving…" : question ? "Update question" : "Create question"}
      </button>
    </form>
  );
}
