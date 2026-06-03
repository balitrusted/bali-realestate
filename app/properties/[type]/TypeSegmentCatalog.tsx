import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import PropertyFilters from "@/components/PropertyFilters";
import Pagination from "@/components/Pagination";
import CatalogListingDivider from "@/components/CatalogListingDivider";
import CatalogFeedbackForm from "@/components/CatalogFeedbackForm";
import CatalogBreadcrumb from "@/components/CatalogBreadcrumb";
import CatalogMapLink from "@/components/CatalogMapLink";
import {
  loadAllPropertiesIncludingArchived,
  loadAllPropertiesForSlugIndex,
  filterProperties,
  paginate,
  CatalogFilters,
  catalogFiltersWithoutMainArea,
  catalogFiltersWithoutSubArea,
  catalogFiltersWithoutBedrooms,
  catalogFiltersWithoutAmenities,
  getAvailableMainAreas,
  getAvailableSubAreas,
  getAvailableBedroomCounts,
  getAvailableAmenityFilterKeys,
  type SegmentKind,
} from "@/lib/propertiesCatalog";
import { buildPropertySlugIndex } from "@/lib/propertySlug";
import { buildTitle, buildH1, buildDescription, buildIntro, buildSeoText } from "@/lib/seoTemplates";
import type { CatalogTypeForSeo } from "@/lib/seoTemplates";
import { PropertyType, MainArea, SubArea } from "@/types/property";
import { mergeSegmentIntoCatalogFilters } from "@/lib/parseCatalogSearchParams";

function parseQueryFilters(
  query: Record<string, string | string[] | undefined>,
  type: CatalogTypeForSeo
): CatalogFilters {
  const filters: CatalogFilters = { type };
  if (query.mainArea && typeof query.mainArea === "string") filters.mainArea = query.mainArea as MainArea;
  if (query.subArea) {
    filters.subArea = (Array.isArray(query.subArea) ? query.subArea : [query.subArea]).map(
      (s) => s as SubArea
    );
  }
  if (query.bedrooms) {
    filters.bedrooms = (Array.isArray(query.bedrooms) ? query.bedrooms : [query.bedrooms]).map(
      (b) => Number(b)
    );
  }
  if (query.minDuration) filters.minDuration = Number(query.minDuration);
  if (query.maxPrice) filters.maxPrice = Number(query.maxPrice);
  const truthy = (v: string | string[] | undefined) => v === "true";
  if (truthy(query.hasBathtub)) filters.hasBathtub = true;
  if (truthy(query.hasCarPark)) filters.hasCarPark = true;
  if (truthy(query.hasClosedKitchen)) filters.hasClosedKitchen = true;
  if (truthy(query.hasDesk)) filters.hasDesk = true;
  if (truthy(query.hasEnclosedLiving)) filters.hasEnclosedLiving = true;
  if (truthy(query.hasGarage)) filters.hasGarage = true;
  if (truthy(query.hasHighSpeedWifi)) filters.hasHighSpeedWifi = true;
  if (truthy(query.hasNatureView)) filters.hasNatureView = true;
  if (truthy(query.hasPetFriendly)) filters.hasPetFriendly = true;
  if (truthy(query.hasPool)) filters.hasPool = true;
  if (truthy(query.hasWashingMachine)) filters.hasWashingMachine = true;
  return filters;
}

type Props = {
  catalogType: CatalogTypeForSeo;
  segmentSlug: string;
  parsed: { kind: SegmentKind; value: string | number };
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function TypeSegmentCatalog({ catalogType, segmentSlug, parsed, searchParams }: Props) {
  const query = searchParams;
  const rawFilters = parseQueryFilters(query, catalogType);
  const page = Math.max(1, parseInt(String(query.page || "1"), 10) || 1);

  const all = await loadAllPropertiesIncludingArchived();
  const allForSlugs = await loadAllPropertiesForSlugIndex();
  const slugIdx = buildPropertySlugIndex(allForSlugs);
  const filtered = filterProperties(all, rawFilters, parsed);
  const { items, total, totalPages, page: currentPage } = paginate(filtered, page);
  const activeItems = items.filter((p) => !p.archived);
  const archivedItems = items.filter((p) => !!p.archived);

  const allowedMainAreas = getAvailableMainAreas(all, catalogFiltersWithoutMainArea(rawFilters), parsed);
  const allowedSubAreas = rawFilters.mainArea
    ? getAvailableSubAreas(all, catalogFiltersWithoutSubArea(rawFilters), parsed)
    : [];
  const allowedBedroomCounts = getAvailableBedroomCounts(all, catalogFiltersWithoutBedrooms(rawFilters), parsed);
  const availableAmenityFilterKeys = getAvailableAmenityFilterKeys(
    all,
    catalogFiltersWithoutAmenities(rawFilters),
    parsed
  );

  const basePath = `/properties/${catalogType}/${segmentSlug}`;
  const searchParamsForPagination: Record<string, string> = { ...query } as Record<string, string>;
  if (rawFilters.mainArea) searchParamsForPagination.mainArea = rawFilters.mainArea;
  if (rawFilters.subArea?.length) searchParamsForPagination.subArea = rawFilters.subArea.join(",");
  if (parsed.kind !== "bedroom" && rawFilters.bedrooms?.length) {
    searchParamsForPagination.bedrooms = rawFilters.bedrooms.join(",");
  }
  if (parsed.kind !== "payment" && rawFilters.minDuration) {
    searchParamsForPagination.minDuration = String(rawFilters.minDuration);
  }
  if (rawFilters.maxPrice) searchParamsForPagination.maxPrice = String(rawFilters.maxPrice);
  if (rawFilters.hasBathtub) searchParamsForPagination.hasBathtub = "true";
  if (rawFilters.hasCarPark) searchParamsForPagination.hasCarPark = "true";
  if (rawFilters.hasClosedKitchen) searchParamsForPagination.hasClosedKitchen = "true";
  if (rawFilters.hasDesk) searchParamsForPagination.hasDesk = "true";
  if (rawFilters.hasEnclosedLiving) searchParamsForPagination.hasEnclosedLiving = "true";
  if (rawFilters.hasGarage) searchParamsForPagination.hasGarage = "true";
  if (rawFilters.hasHighSpeedWifi) searchParamsForPagination.hasHighSpeedWifi = "true";
  if (rawFilters.hasNatureView) searchParamsForPagination.hasNatureView = "true";
  if (rawFilters.hasPetFriendly) searchParamsForPagination.hasPetFriendly = "true";
  if (rawFilters.hasPool) searchParamsForPagination.hasPool = "true";
  if (rawFilters.hasWashingMachine) searchParamsForPagination.hasWashingMachine = "true";

  const mapFilters = mergeSegmentIntoCatalogFilters(rawFilters, parsed);

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <CatalogBreadcrumb
            type={catalogType as "rent" | "sale" | "villas" | "land" | "business"}
            className="mb-0"
          />
          <CatalogMapLink filters={mapFilters} />
        </div>
        <div className="mb-3 rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-emerald-50/40 p-5 md:p-7 shadow-sm">
          <h1 className="text-2xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-2">
            {buildH1(catalogType, undefined, undefined, parsed)}
          </h1>
          <p className="text-sm text-gray-600 max-w-3xl leading-relaxed">{buildIntro(catalogType, undefined, parsed)}</p>
        </div>

        <div className="space-y-6">
          <div>
            <div className="mt-8">
              {items.length === 0 ? (
                <div className="space-y-6">
                  <PropertyFilters
                    defaultType={catalogType === "villas" ? undefined : (catalogType as PropertyType)}
                    baseVariant={catalogType === "land" ? "land" : catalogType === "business" ? "business" : "villas"}
                    matchingCount={total}
                    allowedMainAreas={allowedMainAreas}
                    allowedSubAreas={allowedSubAreas}
                    allowedBedroomCounts={allowedBedroomCounts}
                    availableAmenityKeys={availableAmenityFilterKeys}
                  />
                  <div id="catalog-listings-anchor" className="scroll-mt-8 h-px w-full" aria-hidden />
                  <p className="text-sm text-gray-500">No properties match your criteria.</p>
                  <CatalogFeedbackForm total={total} />
                </div>
              ) : (
                <>
                  <CatalogListingDivider id="catalog-listings-anchor" className="my-6 scroll-mt-8" />
                  <Pagination
                    basePath={basePath}
                    page={currentPage}
                    totalPages={totalPages}
                    searchParams={searchParamsForPagination}
                    navClassName="flex justify-center items-center gap-2 mt-0 mb-2"
                  />
                  <PropertyFilters
                    defaultType={catalogType === "villas" ? undefined : (catalogType as PropertyType)}
                    baseVariant={catalogType === "land" ? "land" : catalogType === "business" ? "business" : "villas"}
                    matchingCount={total}
                    allowedMainAreas={allowedMainAreas}
                    allowedSubAreas={allowedSubAreas}
                    allowedBedroomCounts={allowedBedroomCounts}
                    availableAmenityKeys={availableAmenityFilterKeys}
                  />
                  {activeItems.length > 0 && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activeItems.map((property) => (
                        <PropertyCard
                          key={property.id}
                          property={property}
                          detailSlug={slugIdx.segmentFor(property)}
                        />
                      ))}
                    </div>
                  )}
                  {archivedItems.length > 0 && (
                    <div className="mt-8 mb-6 rounded-lg border border-rose-200 bg-rose-50/60 px-4 py-3 text-sm text-rose-800">
                      <span className="font-semibold">
                        {activeItems.length > 0 ? "Archived villas" : "Only archived villas matched"}
                      </span>{" "}
                      <span className="text-rose-700">(currently not available) can still be opened and requested.</span>
                    </div>
                  )}
                  {archivedItems.length > 0 && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {archivedItems.map((property) => (
                        <PropertyCard
                          key={property.id}
                          property={property}
                          detailSlug={slugIdx.segmentFor(property)}
                        />
                      ))}
                    </div>
                  )}
                  <Pagination
                    basePath={basePath}
                    page={currentPage}
                    totalPages={totalPages}
                    searchParams={searchParamsForPagination}
                  />
                  {totalPages > 1 && <CatalogListingDivider className="mt-6" />}
                  {total < 5 && (
                    <div className="mt-8">
                      <CatalogFeedbackForm total={total} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-16 max-w-3xl text-gray-600 text-sm leading-relaxed">
          <p>{buildSeoText(catalogType, undefined, undefined, parsed)}</p>
          <p className="mt-4">
            Listings change as we verify updates—check back from time to time, or use{" "}
            <Link href="/request" className="text-emerald-800 underline hover:text-emerald-900">
              Request
            </Link>{" "}
            if you want help finding the right fit.
          </p>
        </div>
      </div>
    </div>
  );
}

export function typeSegmentMetadata(
  catalogType: CatalogTypeForSeo,
  segmentSlug: string,
  parsed: { kind: SegmentKind; value: string | number },
  total: number
) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://balitrusted.com";
  const canonicalPath = `/properties/${catalogType}/${segmentSlug}`;
  return {
    title: { absolute: buildTitle(catalogType, undefined, undefined, parsed) },
    description: buildDescription(catalogType, undefined, undefined, parsed),
    alternates: { canonical: `${baseUrl}${canonicalPath}` },
    robots: total === 0 ? { index: false, follow: true } : { index: true, follow: true },
  };
}
