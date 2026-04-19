import type { Metadata } from "next";
import Link from "next/link";
import { loadAllProperties, loadAllPropertiesForSlugIndex } from "@/lib/propertiesCatalog";
import { buildPropertySlugIndex } from "@/lib/propertySlug";
import { rankPropertiesForSearch } from "@/lib/propertySearch";
import PropertyCard from "@/components/PropertyCard";
import SiteSearch from "@/components/SiteSearch";

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://balitrusted.com";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const raw = sp.q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  const title = q ? `Search: ${q}` : "Search properties";
  const desc = q
    ? `Property search results for “${q}” on Balitrusted — curated long-term rentals and sales in Bali.`
    : "Search curated Bali property listings by area, bedrooms, and keywords.";
  return {
    title: { absolute: `${title} | Balitrusted` },
    description: desc,
    alternates: { canonical: `${siteUrl}/search${q ? `?q=${encodeURIComponent(q)}` : ""}` },
    robots: q ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const sp = await searchParams;
  const raw = sp.q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";

  const all = await loadAllProperties();
  const allForSlugs = await loadAllPropertiesForSlugIndex();
  const slugIdx = buildPropertySlugIndex(allForSlugs);
  const ranked = q ? rankPropertiesForSearch(all, q, 50) : [];

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Search properties</h1>
        <p className="text-sm text-gray-600 mb-4">
          Type area, bedrooms (e.g. <span className="font-medium">2 bedroom ubud</span>), villa number, or words from a
          listing.
        </p>
        <div className="mb-8 max-w-xl">
          <SiteSearch />
        </div>

        {q ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
              {ranked.length === 0
                ? `No listings matched “${q}”. Try the catalogue filters or shorter keywords.`
                : `${ranked.length} listing${ranked.length === 1 ? "" : "s"} matching “${q}”.`}
            </p>
            {ranked.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2">
                {ranked.map((property) => (
                  <PropertyCard key={property.id} property={property} detailSlug={slugIdx.segmentFor(property)} />
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500">
            Enter a search above, or go to the{" "}
            <Link href="/properties/villas" className="text-emerald-800 underline hover:text-emerald-900">
              property catalogue
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
