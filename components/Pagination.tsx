"use client";

import { useRouter } from "next/navigation";

interface PaginationProps {
  basePath: string;
  page: number;
  totalPages: number;
  searchParams?: Record<string, string>;
}

export default function Pagination({ basePath, page, totalPages, searchParams }: PaginationProps) {
  const router = useRouter();
  if (totalPages <= 1) return null;

  const params = new URLSearchParams(searchParams);

  const pageUrl = (p: number) => {
    const q = new URLSearchParams(params);
    if (p > 1) q.set("page", String(p));
    const qs = q.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const goToPage = (p: number) => {
    router.push(pageUrl(p), { scroll: false });
  };

  return (
    <nav className="flex justify-center gap-2 mt-8" aria-label="Pagination">
      {page > 1 && (
        <button
          type="button"
          onClick={() => goToPage(page - 1)}
          className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        >
          ← Previous
        </button>
      )}
      <span className="px-4 py-2 text-gray-600">
        Page {page} of {totalPages}
      </span>
      {page < totalPages && (
        <button
          type="button"
          onClick={() => goToPage(page + 1)}
          className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        >
          Next →
        </button>
      )}
    </nav>
  );
}
