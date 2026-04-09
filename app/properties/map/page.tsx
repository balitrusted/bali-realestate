import { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import CatalogBreadcrumb from "@/components/CatalogBreadcrumb";
import PropertiesMapClient, { type PropertyMapPin } from "@/components/PropertiesMapClient";
import {
  loadAllProperties,
  filterProperties,
  loadAllPropertiesForSlugIndex,
} from "@/lib/propertiesCatalog";
import { buildPropertySlugIndex } from "@/lib/propertySlug";
import {
  parseCatalogSearchParams,
  buildListHrefFromFilters,
} from "@/lib/parseCatalogSearchParams";
import { parseLatLng } from "@/lib/mapGeo";
import {
  mapPinShortLabel,
  mapAreaLine,
  mapPriceLine,
  mapPopupTitle,
} from "@/lib/mapListingFormat";
import type { CatalogTypeForSeo } from "@/lib/seoTemplates";
import type { CatalogFilters } from "@/lib/propertiesCatalog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://balitrusted.com";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const query = await searchParams;
  const filters = parseCatalogSearchParams(query);
  const parts: string[] = ["Map"];
  if (filters.mainArea) parts.unshift(String(filters.mainArea));
  if (filters.type) parts.unshift(filters.type === "villas" ? "Villas" : filters.type);
  const title = `${parts.filter(Boolean).join(" · ")} | Balitrusted`;
  return {
    title,
    description:
      "Explore Bali long-term listings on an interactive map. Filter by area and rental type, then open each villa for full details.",
    alternates: { canonical: `${baseUrl}/properties/map` },
  };
}

export default async function PropertiesMapPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const filters: CatalogFilters = parseCatalogSearchParams(query);
  const all = await loadAllProperties();
  const allForSlugs = await loadAllPropertiesForSlugIndex();
  const slugIdx = buildPropertySlugIndex(allForSlugs);
  const filtered = filterProperties(all, filters);
  const withCoords = filtered.filter((p) => parseLatLng(p.displayLocation) != null);

  const pins: PropertyMapPin[] = withCoords.map((p) => {
    const [lat, lng] = parseLatLng(p.displayLocation)!;
    return {
      id: String(p.id),
      lat,
      lng,
      shortLabel: mapPinShortLabel(p),
      popupTitle: mapPopupTitle(p),
      areaLine: mapAreaLine(p),
      priceLine: mapPriceLine(p),
      detailHref: slugIdx.pathFor(p),
    };
  });

  const listHref = buildListHrefFromFilters(filters);
  const cookieStore = await cookies();
  const showStaffMapNote = cookieStore.get("admin-auth")?.value === "true";

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <CatalogBreadcrumb
          type={(filters.type as CatalogTypeForSeo) ?? null}
          area={filters.mainArea ?? null}
          segmentLabel="Map"
          className="mb-3"
        />

        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Property map</h1>
            {showStaffMapNote ? (
              <p className="mt-1 text-sm text-amber-900/90 max-w-2xl rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2">
                Staff: {withCoords.length} of {filtered.length} matching listings have map coordinates. Add precise
                lat,lng in admin on the rest to show more pins.
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-600 max-w-2xl">
                Click a cluster or pin to zoom and open a listing.
              </p>
            )}
          </div>
          <Link
            href={listHref}
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
          >
            ← Browse as list
          </Link>
        </div>

        <PropertiesMapClient pins={pins} />
      </div>
    </div>
  );
}
