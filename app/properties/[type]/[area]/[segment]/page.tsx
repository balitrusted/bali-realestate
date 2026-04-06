import { notFound } from "next/navigation";
import { Metadata } from "next";
import PropertyCard from "@/components/PropertyCard";
import PropertyFilters from "@/components/PropertyFilters";
import Pagination from "@/components/Pagination";
import CatalogListingDivider from "@/components/CatalogListingDivider";
import TopPageNumbers from "@/components/TopPageNumbers";
import CatalogStructuredData from "@/components/CatalogStructuredData";
import {
  loadAllProperties,
  loadAllPropertiesForSlugIndex,
  filterProperties,
  paginate,
  parseSegment,
  CatalogFilters,
  areas,
  catalogFiltersWithoutMainArea,
  catalogFiltersWithoutSubArea,
  catalogFiltersWithoutBedrooms,
  catalogFiltersWithoutAmenities,
  getAvailableMainAreas,
  getAvailableSubAreas,
  getAvailableBedroomCounts,
  getAvailableAmenityFilterKeys,
} from "@/lib/propertiesCatalog";
import { buildPropertySlugIndex } from "@/lib/propertySlug";
import { buildTitle, buildH1, buildDescription, buildIntro, buildSeoText } from "@/lib/seoTemplates";
import { ubudSubAreaFooterParagraphs } from "@/lib/ubudSubAreaContent";
import CatalogBreadcrumb from "@/components/CatalogBreadcrumb";
import { subAreaNames } from "@/types/areas";
import {
  isValidMainAreaSlug,
  resolveAreaLabel,
  resolveAreaSeoDescription,
} from "@/lib/mainAreaRegistry";
import type { CatalogTypeForSeo } from "@/lib/seoTemplates";
import { PropertyType, MainArea, SubArea } from "@/types/property";
import Image from "next/image";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_TYPE_SLUGS = ["rent", "sale", "villas", "land", "business"] as const;
const propertyTypeNames: Record<string, string> = {
  rent: "Rent",
  sale: "Buy",
  land: "Land",
  business: "Business",
  villas: "Villas (Rent or Buy)",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string; area: string; segment: string }>;
}): Promise<Metadata> {
  const { type, area, segment } = await params;
  const mainArea = area as MainArea;

  if (!VALID_TYPE_SLUGS.includes(type as (typeof VALID_TYPE_SLUGS)[number]) || !isValidMainAreaSlug(area)) {
    return { title: "Properties Not Found" };
  }

  const catalogType = type as CatalogTypeForSeo;
  const parsed = parseSegment(segment, mainArea, catalogType);
  if (!parsed) {
    return { title: "Properties Not Found" };
  }

  const subArea = parsed.kind === "subArea" ? (parsed.value as SubArea) : undefined;
  const all = await loadAllProperties();
  const filtered = filterProperties(all, { type: catalogType, mainArea }, parsed);
  const noIndex = filtered.length === 0 || mainArea !== "ubud";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://balitrusted.com";
  const canonicalPath = `/properties/${type}/${area}/${segment}`;
  const kwSub =
    parsed.kind === "subArea" && subArea
      ? `${subAreaNames[subArea]}, Ubud, Bali, villa rental, villa for sale, long-term rent`
      : undefined;

  return {
    title: { absolute: buildTitle(catalogType, mainArea, subArea, parsed) },
    description: buildDescription(catalogType, mainArea, subArea, parsed),
    alternates: { canonical: `${baseUrl}${canonicalPath}` },
    ...(kwSub ? { keywords: kwSub } : {}),
    robots: noIndex ? { index: false, follow: true } : { index: true, follow: true },
  };
}

function parseQueryFilters(
  query: Record<string, string | string[] | undefined>,
  type: CatalogTypeForSeo,
  area: MainArea
): CatalogFilters {
  const filters: CatalogFilters = { type, mainArea: area };
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

export default async function PropertiesSegmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; area: string; segment: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { type, area, segment } = await params;
  const query = await searchParams;
  if (!VALID_TYPE_SLUGS.includes(type as (typeof VALID_TYPE_SLUGS)[number]) || !isValidMainAreaSlug(area)) {
    notFound();
  }
  const catalogType = type as CatalogTypeForSeo;
  const mainArea = area as MainArea;

  const parsed = parseSegment(segment, mainArea, catalogType);
  if (!parsed) {
    notFound();
  }

  const rawFilters = parseQueryFilters(query, catalogType, mainArea);
  const filters: CatalogFilters = { ...rawFilters };
  if (parsed.kind === "subArea") {
    delete filters.subArea;
  }
  const page = Math.max(1, parseInt(String(query.page || "1"), 10) || 1);

  const all = await loadAllProperties();
  const allForSlugs = await loadAllPropertiesForSlugIndex();
  const slugIdx = buildPropertySlugIndex(allForSlugs);
  const filtered = filterProperties(all, filters, parsed);
  const { items, total, totalPages, page: currentPage } = paginate(filtered, page);

  const subArea = parsed.kind === "subArea" ? (parsed.value as SubArea) : undefined;
  const areaInfo = areas[mainArea as keyof typeof areas];
  const areaDisplayName = areaInfo?.nameEn ?? resolveAreaLabel(area);
  const basePath = `/properties/${catalogType}/${mainArea}/${segment}`;

  const searchParamsForPagination: Record<string, string> = { ...query } as Record<string, string>;
  if (parsed.kind === "subArea") delete searchParamsForPagination.subArea;
  else if (filters.subArea?.length) searchParamsForPagination.subArea = filters.subArea.join(",");
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

  const allowedMainAreas = getAvailableMainAreas(all, catalogFiltersWithoutMainArea(filters), parsed);
  const allowedSubAreas = getAvailableSubAreas(all, catalogFiltersWithoutSubArea(filters), parsed);
  const allowedBedroomCounts = getAvailableBedroomCounts(all, catalogFiltersWithoutBedrooms(filters), parsed);
  const availableAmenityFilterKeys = getAvailableAmenityFilterKeys(
    all,
    catalogFiltersWithoutAmenities(filters),
    parsed
  );

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://balitrusted.com";

  const segmentLabel =
    parsed.kind === "bedroom"
      ? `${parsed.value} bed${Number(parsed.value) === 1 ? "" : "s"}`
      : parsed.kind === "payment"
        ? (parsed.value === "yearly" ? "Yearly" : "Monthly")
        : parsed.kind === "amenity"
          ? (parsed.value as string).replace(/-/g, " ")
          : parsed.kind === "subArea"
            ? subAreaNames[parsed.value as SubArea]
            : null;

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <link rel="canonical" href={`${baseUrl}${basePath}`} />
        <CatalogBreadcrumb
          type={catalogType as "rent" | "sale" | "villas" | "land" | "business"}
          area={mainArea}
          segmentLabel={segmentLabel ?? undefined}
          className="mb-3"
        />
        {items.length > 0 && (
          <CatalogStructuredData
            properties={items}
            baseUrl={baseUrl}
            listName={buildH1(catalogType, mainArea, subArea, parsed)}
            allPropertiesForSlugs={allForSlugs}
          />
        )}
        {areaInfo?.image && (
          <div className="relative w-full h-64 md:h-96 mb-3 rounded-lg overflow-hidden">
            <Image
              src={areaInfo.image}
              alt={areaDisplayName}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-2xl md:text-4xl font-semibold tracking-tight mb-2">
                  {buildH1(catalogType, mainArea, subArea, parsed)}
                </h1>
              </div>
            </div>
          </div>
        )}

        {areaInfo?.image && parsed.kind === "subArea" && (
          <p className="text-gray-600 mt-4 text-sm max-w-3xl leading-relaxed">
            {buildIntro(catalogType, mainArea, parsed)}
          </p>
        )}

        {!areaInfo?.image && (
          <div className="mb-3 rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-emerald-50/40 p-5 md:p-7 shadow-sm">
            <h1 className="text-2xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-2">
              {buildH1(catalogType, mainArea, subArea, parsed)}
            </h1>
            <p className="text-gray-600 mt-4 text-sm max-w-3xl leading-relaxed">
              {parsed.kind === "subArea"
                ? buildIntro(catalogType, mainArea, parsed)
                : areaInfo?.description ?? resolveAreaSeoDescription(area)}
            </p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            {items.length === 0 ? (
              <div className="space-y-6 py-12">
                <PropertyFilters
                  defaultType={catalogType === "villas" ? undefined : (catalogType as PropertyType)}
                  defaultMainArea={mainArea}
                  pathSubArea={subArea}
                  allowedMainAreas={allowedMainAreas}
                  allowedSubAreas={allowedSubAreas}
                  allowedBedroomCounts={allowedBedroomCounts}
                  availableAmenityKeys={availableAmenityFilterKeys}
                  baseVariant={catalogType === "land" ? "land" : catalogType === "business" ? "business" : "villas"}
                  matchingCount={total}
                />
                <div className="text-center">
                  <div id="catalog-listings-anchor" className="scroll-mt-8 h-px w-full max-w-none" aria-hidden />
                  <p className="text-gray-600 mb-4">No properties found in this category.</p>
                  <p className="text-sm text-gray-500">Try other filters or areas.</p>
                </div>
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
                      basePath={basePath}
                      page={currentPage}
                      totalPages={totalPages}
                      searchParams={searchParamsForPagination}
                    />
                  </div>
                )}
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
                  defaultMainArea={mainArea}
                  pathSubArea={subArea}
                  allowedMainAreas={allowedMainAreas}
                  allowedSubAreas={allowedSubAreas}
                  allowedBedroomCounts={allowedBedroomCounts}
                  availableAmenityKeys={availableAmenityFilterKeys}
                  baseVariant={catalogType === "land" ? "land" : catalogType === "business" ? "business" : "villas"}
                  matchingCount={total}
                />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      detailSlug={slugIdx.segmentFor(property)}
                    />
                  ))}
                </div>
                <Pagination
                  basePath={basePath}
                  page={currentPage}
                  totalPages={totalPages}
                  searchParams={searchParamsForPagination}
                />
                {totalPages > 1 && <CatalogListingDivider className="mt-6" />}
              </>
            )}
          </div>
        </div>

        {total > 0 && (
          <div className="mt-16 max-w-3xl text-gray-600 text-sm leading-relaxed">
            {parsed.kind === "subArea" && subArea ? (
              <div className="space-y-4">
                {ubudSubAreaFooterParagraphs(subArea).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            ) : (
              buildSeoText(catalogType, mainArea, subArea, parsed)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
