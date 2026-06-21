import Link from "next/link";
import type { ResolvedPopularSearchGroup } from "@/lib/catalogPopularSearches";

interface CatalogPopularSearchesProps {
  groups: ResolvedPopularSearchGroup[];
  /** full = grouped sections on /properties; compact = flat chip list on homepage */
  variant?: "full" | "compact";
  id?: string;
  viewAllHref?: string;
}

export default function CatalogPopularSearches({
  groups,
  variant = "full",
  id = "popular-searches",
  viewAllHref,
}: CatalogPopularSearchesProps) {
  if (groups.length === 0) return null;

  const allLinks = groups.flatMap((g) => g.links);

  if (variant === "compact") {
    return (
      <section className="py-8 border-t border-gray-100 bg-white" aria-labelledby={`${id}-heading`}>
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
            <div>
              <h2 id={`${id}-heading`} className="text-[1.375rem] font-bold text-gray-900">
                Popular searches
              </h2>
              <p className="text-sm text-gray-600 mt-1 max-w-2xl">
                Quick links into our Ubud rent categories — bedrooms, payment terms, pool, and neighborhoods.
              </p>
            </div>
            {viewAllHref ? (
              <Link
                href={viewAllHref}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-900 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap"
              >
                All categories
              </Link>
            ) : null}
          </div>
          <ul className="flex flex-wrap gap-2">
            {allLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-800 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section
      id={id}
      className="mb-3 rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-stone-50/80 p-5 md:p-7 shadow-sm scroll-mt-8"
      aria-labelledby={`${id}-heading`}
    >
      <h2 id={`${id}-heading`} className="text-xl font-semibold text-gray-900 leading-snug mb-1">
        Popular searches
      </h2>
      <p className="text-sm text-gray-600 max-w-3xl leading-relaxed mb-5">
        Browse curated Ubud rental categories with clean URLs — bedroom counts, monthly and yearly terms, amenities,
        and neighborhood filters.
      </p>
      <div className="space-y-5">
        {groups.map((group) => (
          <div key={group.id}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{group.label}</h3>
            <ul className="flex flex-wrap gap-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-800 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
