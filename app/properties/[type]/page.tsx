import { notFound } from "next/navigation";
import PropertyCard from "@/components/PropertyCard";
import PropertyFilters from "@/components/PropertyFilters";
import Pagination from "@/components/Pagination";
import CatalogListingDivider from "@/components/CatalogListingDivider";
import TopPageNumbers from "@/components/TopPageNumbers";
import CatalogFeedbackForm from "@/components/CatalogFeedbackForm";
import CatalogBreadcrumb from "@/components/CatalogBreadcrumb";
import {
  loadAllProperties,
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
} from "@/lib/propertiesCatalog";
import { buildTitle, buildH1, buildDescription, buildSeoText, buildIntro } from "@/lib/seoTemplates";
import type { CatalogTypeForSeo } from "@/lib/seoTemplates";
import { PropertyType, MainArea, SubArea } from "@/types/property";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_TYPE_SLUGS = ["rent", "sale", "villas", "land", "business"] as const;
export type CatalogTypeSlug = (typeof VALID_TYPE_SLUGS)[number];

const propertyTypeNames: Record<string, string> = {
  rent: "Rent",
  sale: "Buy",
  land: "Land",
  business: "Business",
  villas: "Villas (Rent or Buy)",
};

const propertyTypeVerbs: Record<string, string> = {
  rent: "Rent",
  sale: "Buy",
  land: "Buy",
  business: "Buy",
  villas: "Rent or Buy",
};

// (No wizard UI on this page; only filters + results.)

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!VALID_TYPE_SLUGS.includes(type as CatalogTypeSlug)) {
    return { title: "Properties Not Found" };
  }
  const catalogType = type as CatalogTypeForSeo;
  const all = await loadAllProperties();
  const filtered = filterProperties(all, { type: catalogType });
  const noIndex = filtered.length === 0;
  return {
    title: buildTitle(catalogType),
    description: buildDescription(catalogType),
    robots: noIndex ? { index: false, follow: true } : { index: true, follow: true },
  };
}

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

export default async function PropertiesByTypePage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { type } = await params;
  const query = await searchParams;
  if (!VALID_TYPE_SLUGS.includes(type as CatalogTypeSlug)) {
    notFound();
  }
  const catalogType = type as CatalogTypeForSeo;

  const filters = parseQueryFilters(query, catalogType);
  const page = Math.max(1, parseInt(String(query.page || "1"), 10) || 1);

  const all = await loadAllProperties();
  const filtered = filterProperties(all, filters);
  const { items, total, totalPages, page: currentPage } = paginate(filtered, page);

  const allowedMainAreas = getAvailableMainAreas(all, catalogFiltersWithoutMainArea(filters));
  const allowedSubAreas = filters.mainArea
    ? getAvailableSubAreas(all, catalogFiltersWithoutSubArea(filters))
    : [];
  const allowedBedroomCounts = getAvailableBedroomCounts(all, catalogFiltersWithoutBedrooms(filters));
  const availableAmenityFilterKeys = getAvailableAmenityFilterKeys(
    all,
    catalogFiltersWithoutAmenities(filters)
  );

  const searchParamsForPagination: Record<string, string> = { ...query } as Record<string, string>;
  if (filters.mainArea) searchParamsForPagination.mainArea = filters.mainArea;
  if (filters.subArea?.length) searchParamsForPagination.subArea = filters.subArea.join(",");
  if (filters.bedrooms?.length) searchParamsForPagination.bedrooms = filters.bedrooms.join(",");
  if (filters.minDuration) searchParamsForPagination.minDuration = String(filters.minDuration);
  if (filters.maxPrice) searchParamsForPagination.maxPrice = String(filters.maxPrice);
  if (filters.hasBathtub) searchParamsForPagination.hasBathtub = "true";
  if (filters.hasCarPark) searchParamsForPagination.hasCarPark = "true";
  if (filters.hasClosedKitchen) searchParamsForPagination.hasClosedKitchen = "true";
  if (filters.hasDesk) searchParamsForPagination.hasDesk = "true";
  if (filters.hasEnclosedLiving) searchParamsForPagination.hasEnclosedLiving = "true";
  if (filters.hasGarage) searchParamsForPagination.hasGarage = "true";
  if (filters.hasHighSpeedWifi) searchParamsForPagination.hasHighSpeedWifi = "true";
  if (filters.hasNatureView) searchParamsForPagination.hasNatureView = "true";
  if (filters.hasPetFriendly) searchParamsForPagination.hasPetFriendly = "true";
  if (filters.hasPool) searchParamsForPagination.hasPool = "true";
  if (filters.hasWashingMachine) searchParamsForPagination.hasWashingMachine = "true";

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <CatalogBreadcrumb
          type={catalogType as "rent" | "sale" | "villas" | "land" | "business"}
          className="mb-3"
        />
        <div className="mb-3 rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-emerald-50/40 p-5 md:p-7 shadow-sm">
          <h1 className="text-xl md:text-3xl font-semibold tracking-tight text-gray-900 mb-2">
            {buildH1(catalogType)}
          </h1>
          <p className="text-gray-600 text-base md:text-lg max-w-3xl">
            {buildIntro(catalogType)}
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <PropertyFilters
              defaultType={catalogType === "villas" ? undefined : (catalogType as PropertyType)}
              baseVariant={catalogType === "land" ? "land" : catalogType === "business" ? "business" : "villas"}
              matchingCount={total}
              allowedMainAreas={allowedMainAreas}
              allowedSubAreas={allowedSubAreas}
              allowedBedroomCounts={allowedBedroomCounts}
              availableAmenityKeys={availableAmenityFilterKeys}
            />

            <div className="mt-8">
            {items.length === 0 ? (
              <div className="space-y-6">
                <div id="catalog-listings-anchor" className="scroll-mt-8 h-px w-full" aria-hidden />
                <p className="text-sm text-gray-500">No properties match your criteria.</p>
                <CatalogFeedbackForm total={total} />
              </div>
            ) : (
              <>
                {/* RESTORE-CATALOG-TOP-COUNT-PAGINATION — temporarily hidden. Say "restore RESTORE-CATALOG-TOP-COUNT-PAGINATION" to undo. */}
                {false && (
                  <div className="mt-3 mb-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 flex items-center justify-between gap-4">
                    <div className="text-xs font-medium text-gray-600">
                      Found {total} {total === 1 ? "property" : "properties"}
                    </div>
                    <TopPageNumbers
                      basePath={`/properties/${catalogType}`}
                      page={currentPage}
                      totalPages={totalPages}
                      searchParams={searchParamsForPagination}
                    />
                  </div>
                )}
                <CatalogListingDivider id="catalog-listings-anchor" className="my-6 scroll-mt-8" />
                <Pagination
                  basePath={`/properties/${catalogType}`}
                  page={currentPage}
                  totalPages={totalPages}
                  searchParams={searchParamsForPagination}
                  navClassName="flex justify-center items-center gap-2 mt-0 mb-2"
                />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
                <Pagination
                  basePath={`/properties/${catalogType}`}
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
          {buildSeoText(catalogType)}
        </div>
      </div>
    </div>
  );
}
