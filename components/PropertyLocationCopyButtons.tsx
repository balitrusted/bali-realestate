"use client";

import { useState } from "react";

type Props = {
  exactLocation?: string;
  approximateLocationUrl?: string;
  className?: string;
};

const locations = [
  { key: "exactLocation", label: "Exact location", text: "Exact" },
  { key: "approximateLocationUrl", label: "Approximate location", text: "Approx" },
] as const;

export default function PropertyLocationCopyButtons({
  exactLocation,
  approximateLocationUrl,
  className = "",
}: Props) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyError, setCopyError] = useState(false);
  const links = { exactLocation, approximateLocationUrl };

  const copyLocation = async (key: (typeof locations)[number]["key"]) => {
    const url = links[key]?.trim();
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      setCopyError(false);
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 2000);
    } catch {
      setCopiedKey(null);
      setCopyError(true);
    }
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-1.5">
        {locations.map(({ key, label, text }) => {
          const hasLink = !!links[key]?.trim();
          const copied = copiedKey === key;
          return (
            <button
              key={key}
              type="button"
              disabled={!hasLink}
              onClick={() => void copyLocation(key)}
              title={hasLink ? `Copy ${label.toLowerCase()} link` : `${label} link is not set`}
              aria-label={hasLink ? `Copy ${label.toLowerCase()} link` : `${label} link is not set`}
              className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-0.5 text-xs font-medium text-stone-700 transition-colors hover:border-emerald-700 hover:bg-emerald-50 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400 disabled:hover:border-stone-200 disabled:hover:bg-stone-100 disabled:hover:text-stone-400"
            >
              <svg aria-hidden="true" className="h-3 w-3" viewBox="0 0 20 20" fill="none">
                {copied ? (
                  <path d="M5 10.5l3.5 3.5L15 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <path
                    d="M10 17s5-4.6 5-9a5 5 0 0 0-10 0c0 4.4 5 9 5 9Zm0-6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
              {copied ? "Copied" : text}
            </button>
          );
        })}
      </div>
      {copyError ? (
        <p className="mt-1 text-xs text-red-700" role="alert">
          Could not copy the location link. Please try again.
        </p>
      ) : null}
    </div>
  );
}
