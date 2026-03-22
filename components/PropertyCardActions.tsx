"use client";

import { useSavedOptional } from "@/components/SavedProvider";

interface PropertyCardActionsProps {
  propertyId: string;
  /** "card" = absolute on image corner; "inline" = row next to title */
  layout?: "card" | "inline";
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg className="w-5 h-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}

function CompareIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  );
}

export default function PropertyCardActions({ propertyId, layout = "card" }: PropertyCardActionsProps) {
  const saved = useSavedOptional();
  if (!saved) return null;

  const isFav = saved.favorites.includes(propertyId);
  const inCompare = saved.compare.includes(propertyId);

  const wrapClass =
    layout === "inline"
      ? "relative z-10 flex gap-1.5 shrink-0"
      : "absolute top-2 right-2 z-10 flex gap-1.5";

  return (
    <div
      className={wrapClass}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <button
        type="button"
        onClick={() => saved.toggleFavorite(propertyId)}
        className="p-2 rounded-full bg-white/90 hover:bg-white shadow-sm text-gray-600 hover:text-red-500 transition-colors"
        title={isFav ? "Remove from favorites" : "Add to favorites"}
        aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
      >
        <HeartIcon filled={isFav} />
      </button>
      <button
        type="button"
        onClick={() => saved.toggleCompare(propertyId)}
        className={`p-2 rounded-full shadow-sm transition-colors ${
          inCompare
            ? "bg-gray-900 text-white hover:bg-gray-800"
            : "bg-white/90 hover:bg-white text-gray-600 hover:text-gray-900"
        }`}
        title={inCompare ? "Remove from compare" : "Add to compare"}
        aria-label={inCompare ? "Remove from compare" : "Add to compare"}
      >
        <CompareIcon />
      </button>
    </div>
  );
}
