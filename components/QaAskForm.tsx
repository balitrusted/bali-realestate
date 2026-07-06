"use client";

import { useState } from "react";
import { QA_CATEGORY_ORDER, qaCategoryLabel } from "@/lib/qaHub";
import type { QaCategory } from "@/types/qa";

interface QaAskFormProps {
  /** When set, pre-select category (e.g. on category pages). */
  defaultCategory?: QaCategory;
  className?: string;
}

export default function QaAskForm({ defaultCategory = "rent", className = "" }: QaAskFormProps) {
  const [open, setOpen] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [title, setTitle] = useState("");
  const [questionBody, setQuestionBody] = useState("");
  const [category, setCategory] = useState<QaCategory>(defaultCategory);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const resetForm = () => {
    setTitle("");
    setQuestionBody("");
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/qa/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName,
          authorEmail,
          title,
          questionBody,
          category,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({
          type: "ok",
          text: data.message || "Submitted! We will review and publish your question soon.",
        });
        setTitle("");
        setQuestionBody("");
      } else {
        setMessage({ type: "err", text: data.error || "Something went wrong." });
      }
    } catch {
      setMessage({ type: "err", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors font-medium"
        >
          Ask a question
        </button>
      ) : (
        <div id="qa-ask-form" className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Ask a question</h2>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Your question is reviewed before it goes live. Email is only used for moderation and
            replies, not shown publicly.
          </p>
          {message ? (
            <div
              className={`mb-4 p-3 rounded-md text-sm ${
                message.type === "ok"
                  ? "bg-emerald-50 text-emerald-900 border border-emerald-100"
                  : "bg-red-50 text-red-800 border border-red-100"
              }`}
            >
              {message.text}
            </div>
          ) : null}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Your name</label>
                <input
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Email</label>
                <input
                  type="email"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as QaCategory)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                disabled={loading}
              >
                {QA_CATEGORY_ORDER.map((c) => (
                  <option key={c} value={c}>
                    {qaCategoryLabel(c)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Your question</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                placeholder="e.g. how much for 2br villa in ubud long term?"
                required
                minLength={10}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                More detail (optional)
              </label>
              <textarea
                value={questionBody}
                onChange={(e) => setQuestionBody(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                placeholder="Dates, budget, kids, pets…"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Submitting…" : "Submit question"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
