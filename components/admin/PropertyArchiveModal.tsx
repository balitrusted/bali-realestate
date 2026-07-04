"use client";

import { useEffect, useState } from "react";
import {
  PROPERTY_ARCHIVE_REASONS,
  type PropertyArchiveReason,
  formatArchiveHistoryComment,
} from "@/lib/propertyArchiveReasons";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  submitLabel?: string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (historyComment: string) => void | Promise<void>;
};

export default function PropertyArchiveModal({
  open,
  title,
  description,
  submitLabel = "Archive",
  loading = false,
  onClose,
  onSubmit,
}: Props) {
  const [reason, setReason] = useState<PropertyArchiveReason | "">("");
  const [guestName, setGuestName] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
      setGuestName("");
    }
  }, [open]);

  if (!open) return null;

  const guestRequired = reason === "rented_by_us";
  const guestTrimmed = guestName.trim();
  const canSubmit =
    reason !== "" && (!guestRequired || guestTrimmed.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description ? <p className="mt-2 text-sm text-gray-600">{description}</p> : null}

        <label className="mt-4 block text-sm font-medium text-gray-900" htmlFor="archive-reason">
          Reason
        </label>
        <select
          id="archive-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value as PropertyArchiveReason | "")}
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:ring-gray-500"
        >
          <option value="">Select a reason…</option>
          {PROPERTY_ARCHIVE_REASONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {guestRequired ? (
          <>
            <label className="mt-4 block text-sm font-medium text-gray-900" htmlFor="archive-guest">
              Guest name
            </label>
            <input
              id="archive-guest"
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Who rented or bought this listing?"
              autoFocus
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:ring-gray-500"
            />
          </>
        ) : null}

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
            onClick={() => {
              if (!reason) return;
              void onSubmit(formatArchiveHistoryComment(reason, guestName));
            }}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving…" : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
