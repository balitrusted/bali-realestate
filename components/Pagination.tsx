"use client";

import { useRouter } from "next/navigation";

interface PaginationProps {
  basePath: string;
  page: number;
  totalPages: number;
  searchParams?: Record<string, string>;
  /** Override default nav layout/margins (default: flex + centered + mt-8) */
  navClassName?: string;
}

export default function Pagination({
  basePath,
  page,
  totalPages,
  searchParams,
  navClassName,
}: PaginationProps) {
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
    <nav
      className={navClassName ?? "flex justify-center items-center gap-2 mt-8"}
      aria-label="Pagination"
    >
      {page > 1 && (
        <button
          type="button"
          onClick={() => goToPage(page - 1)}
          className="px-2.5 py-1 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:scale-[0.99]"
        >
          ← Previous
        </button>
      )}
      <span className="px-2 py-1 text-sm text-gray-600 tabular-nums">
        Page {page} of {totalPages}
      </span>
      {page < totalPages && (
        <button
          type="button"
          onClick={() => goToPage(page + 1)}
          className="px-2.5 py-1 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:scale-[0.99]"
        >
          Next →
        </button>
      )}
    </nav>
  );
}
