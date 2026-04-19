"use client";

import Link from "next/link";
import { useSavedOptional } from "@/components/SavedProvider";

export default function HeaderSavedLink() {
  const saved = useSavedOptional();
  const total = saved ? saved.favorites.length + saved.compare.length : 0;

  return (
    <Link
      href="/saved"
      aria-label="Saved properties"
      title="Saved"
      className="group inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
    >
      <span className="relative inline-flex shrink-0">
        <svg
          className="h-5 w-5 transition-colors group-hover:text-red-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
        {total > 0 && (
          <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-gray-900 px-1 text-[10px] font-semibold text-white">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </span>
      <span className="max-w-0 overflow-hidden text-xs font-medium text-gray-500 opacity-0 transition-[max-width,opacity,margin] duration-200 ease-out group-hover:max-w-[3.5rem] group-hover:opacity-100 group-hover:text-gray-900">
        Saved
      </span>
    </Link>
  );
}
