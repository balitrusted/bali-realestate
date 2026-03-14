"use client";

import Link from "next/link";
import { useSavedOptional } from "@/components/SavedProvider";

export default function HeaderSavedLink() {
  const saved = useSavedOptional();
  const total = saved ? saved.favorites.length + saved.compare.length : 0;

  return (
    <Link
      href="/saved"
      className="relative inline-flex items-center gap-1.5 text-gray-700 hover:text-gray-900"
    >
      <span>[ saved ]</span>
      {total > 0 && (
        <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-medium bg-gray-900 text-white rounded-full">
          {total}
        </span>
      )}
    </Link>
  );
}
