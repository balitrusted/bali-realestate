"use client";

import { useState } from "react";

interface QaReplyFormProps {
  questionId: string;
}

export default function QaReplyForm({ questionId }: QaReplyFormProps) {
  const [open, setOpen] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/qa/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          authorName,
          authorEmail,
          content,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({
          type: "ok",
          text: data.message || "Submitted! Your answer will appear after moderation.",
        });
        setContent("");
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
    <section className="mt-10 pt-8 border-t border-gray-200">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-5 py-2.5 border border-gray-300 text-gray-900 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          Add your answer
        </button>
      ) : (
        <div className="p-5 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Your answer</h2>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setMessage(null);
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Share your experience or tip. Reviewed before publishing. Email is not shown publicly.
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Answer</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Be specific and helpful…"
                required
                minLength={20}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 text-sm"
            >
              {loading ? "Submitting…" : "Submit answer"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
