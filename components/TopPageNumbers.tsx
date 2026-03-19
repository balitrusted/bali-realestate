"use client";

import { useRouter } from "next/navigation";

interface TopPageNumbersProps {
  basePath: string;
  page: number;
  totalPages: number;
  searchParams?: Record<string, string>;
}

export default function TopPageNumbers({
  basePath,
  page,
  totalPages,
  searchParams,
}: TopPageNumbersProps) {
  const router = useRouter();
  if (totalPages <= 1) return null;

  const params = new URLSearchParams(searchParams ?? {});
  // We always control the `page` query param ourselves for the numbered links.
  params.delete("page");

  const pageUrl = (p: number) => {
    const q = new URLSearchParams(params);
    if (p > 1) q.set("page", String(p));
    const qs = q.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const goToPage = (p: number) => {
    // Keep scroll position on mobile Safari by disabling the scroll reset.
    router.push(pageUrl(p), { scroll: false });
  };

  return (
    <div className="flex items-center justify-end gap-2 flex-wrap" aria-label="Page numbers">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
        const isActive = p === page;

        const common =
          "h-6 w-6 flex items-center justify-center rounded border text-xs font-medium leading-none transition-colors";
        const inactive = "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300";
        const active = "bg-emerald-50 border-emerald-200 text-emerald-800";

        if (isActive) {
          return (
            <span key={p} className={`${common} ${active}`} aria-current="page">
              {p}
            </span>
          );
        }

        return (
          <button
            key={p}
            type="button"
            onClick={() => goToPage(p)}
            className={`${common} ${inactive}`}
            aria-label={`Go to page ${p}`}
          >
            {p}
          </button>
        );
      })}
    </div>
  );
}

