"use client";

import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  commentLabel?: string;
  commentPlaceholder?: string;
  submitLabel: string;
  submitClassName?: string;
  required?: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void | Promise<void>;
};

export default function PropertyCommentModal({
  open,
  title,
  description,
  commentLabel = "Comment",
  commentPlaceholder = "Add a note for the history log…",
  submitLabel,
  submitClassName = "bg-gray-900 hover:bg-gray-800",
  required = true,
  loading = false,
  onClose,
  onSubmit,
}: Props) {
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (open) setComment("");
  }, [open]);

  if (!open) return null;

  const trimmed = comment.trim();
  const canSubmit = !required || trimmed.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description ? <p className="mt-2 text-sm text-gray-600">{description}</p> : null}

        <label className="mt-4 block text-sm font-medium text-gray-900" htmlFor="property-comment">
          {commentLabel}
        </label>
        <textarea
          id="property-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={commentPlaceholder}
          rows={4}
          autoFocus
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:ring-gray-500"
        />

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !canSubmit}
            onClick={() => void onSubmit(trimmed)}
            className={`rounded-md px-4 py-2 text-sm text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${submitClassName}`}
          >
            {loading ? "Saving…" : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
