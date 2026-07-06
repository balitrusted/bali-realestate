"use client";

import { useCallback, useEffect, useState } from "react";
import type { QaAnswer } from "@/types/qa";
import { formatLocaleDate } from "@/lib/formatDate";

interface QaAnswerLikeProps {
  answerId: string;
  initialUpvotes: number;
  className?: string;
}

export function QaAnswerLike({ answerId, initialUpvotes, className = "" }: QaAnswerLikeProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUpvotes(initialUpvotes);
  }, [initialUpvotes]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/qa/vote?answerId=${encodeURIComponent(answerId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setUpvotes(data.upvotes ?? initialUpvotes);
          setLiked(!!data.liked);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [answerId, initialUpvotes]);

  const toggle = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/qa/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setUpvotes(data.upvotes ?? upvotes);
        setLiked(!!data.liked);
      } else if (res.status === 429) {
        alert(data.error || "Slow down a bit.");
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [answerId, loading, upvotes]);

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-pressed={liked}
      title={liked ? "Remove helpful vote" : "Mark as helpful"}
      aria-label={liked ? "Remove helpful vote" : "Mark as helpful"}
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs transition-colors disabled:opacity-50 ${
        liked
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
      } ${className}`}
    >
      <svg
        className={`w-3.5 h-3.5 shrink-0 ${liked ? "fill-emerald-600 text-emerald-600" : "fill-none"}`}
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
        />
      </svg>
      <span className="font-medium tabular-nums leading-none">{upvotes}</span>
    </button>
  );
}

interface QaAnswerBlockProps {
  answer: QaAnswer;
  variant?: "official" | "default";
}

export default function QaAnswerBlock({ answer, variant = "default" }: QaAnswerBlockProps) {
  if (variant === "official") {
    return (
      <section className="bg-emerald-50/80 border border-emerald-100 rounded-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
              Official answer
            </span>
            <span className="text-xs text-gray-500">{formatLocaleDate(answer.createdAt)}</span>
          </div>
        </div>
        <p className="text-gray-800 leading-relaxed whitespace-pre-line">{answer.content}</p>
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
          <p className="text-xs text-gray-500">
            by <span className="text-gray-700">{answer.authorDisplayName}</span>
            {" · "}
            {formatLocaleDate(answer.createdAt)}
          </p>
          <QaAnswerLike answerId={answer.id} initialUpvotes={answer.upvotes} />
        </div>
      </section>
    );
  }

  return (
    <section className="border border-gray-200 rounded-lg p-5">
      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{answer.content}</p>
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
        <p className="text-xs text-gray-500">
          by <span className="text-gray-700">{answer.authorDisplayName}</span>
          {" · "}
          {formatLocaleDate(answer.createdAt)}
        </p>
        <QaAnswerLike answerId={answer.id} initialUpvotes={answer.upvotes} />
      </div>
    </section>
  );
}
