import Link from "next/link";
import { buildMapHrefFromFilters } from "@/lib/parseCatalogSearchParams";
import type { CatalogFilters } from "@/lib/propertiesCatalog";

export default function CatalogMapLink({
  filters,
  className,
  children = "View on map",
}: {
  filters: CatalogFilters;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={buildMapHrefFromFilters(filters)}
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100 transition-colors"
      }
    >
      <span aria-hidden>📍</span>
      {children}
    </Link>
  );
}
