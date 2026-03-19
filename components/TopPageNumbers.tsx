import Link from "next/link";

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

  return (
    <div className="flex items-center justify-end gap-2 flex-wrap" aria-label="Page numbers">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
        const isActive = p === page;

        const common =
          "h-10 w-10 flex items-center justify-center rounded-md border text-sm font-medium transition-colors";
        const inactive = "bg-white border-gray-300 text-gray-700 hover:bg-gray-50";
        const active = "bg-emerald-50 border-emerald-200 text-emerald-800";

        if (isActive) {
          return (
            <span key={p} className={`${common} ${active}`} aria-current="page">
              {p}
            </span>
          );
        }

        return (
          <Link key={p} href={pageUrl(p)} className={`${common} ${inactive}`}>
            {p}
          </Link>
        );
      })}
    </div>
  );
}

