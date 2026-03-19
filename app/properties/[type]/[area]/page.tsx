import { notFound } from "next/navigation";
import { Metadata } from "next";
import PropertyCard from "@/components/PropertyCard";
import PropertyFilters from "@/components/PropertyFilters";
import Pagination from "@/components/Pagination";
import TopPageNumbers from "@/components/TopPageNumbers";
import CatalogFeedbackForm from "@/components/CatalogFeedbackForm";
import CatalogBreadcrumb from "@/components/CatalogBreadcrumb";
import CatalogStructuredData from "@/components/CatalogStructuredData";
import { Property, PropertyType, MainArea, SubArea } from "@/types/property";
import { areas } from "@/types/areas";
import {
  loadAllProperties,
  filterProperties,
  paginate,
  CatalogFilters,
} from "@/lib/propertiesCatalog";
import { buildH1, buildSeoText } from "@/lib/seoTemplates";
import type { CatalogTypeForSeo } from "@/lib/seoTemplates";
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

const propertyTypeVerbs: Record<string, string> = {
  rent: "Rent",
  sale: "Buy",
  land: "Buy",
  business: "Buy",
  villas: "Rent or Buy",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string; area: string }>;
}): Promise<Metadata> {
  const { type, area } = await params;
  const mainArea = area as MainArea;

  if (!VALID_TYPE_SLUGS.includes(type as (typeof VALID_TYPE_SLUGS)[number]) || !areas[mainArea]) {
    return { title: "Properties Not Found" };
  }

  const catalogType = type as CatalogTypeForSeo;
  const areaInfo = areas[mainArea];
  const typeName = propertyTypeNames[type];
  const verb = propertyTypeVerbs[type];
  const subject =
    type === "rent" ? "Villas" : type === "sale" ? "Villas" : type === "villas" ? "Villas" : type === "land" ? "Land" : "Business";
  const title = `${verb} ${subject} in ${areaInfo.nameEn}`;
  const description =
    areaInfo.seoDescription ||
    `Find ${typeName.toLowerCase()} in ${areaInfo.nameEn}. ${areaInfo.description}`;

  const all = await loadAllProperties();
  const filtered = filterProperties(all, { type: catalogType, mainArea });
  const noIndex = filtered.length === 0;

  return {
    title: `${title} - Balitrusted`,
    description,
    keywords: `${areaInfo.nameEn}, ${typeName}, Bali, real estate, ${type === "rent" ? "rental" : type === "sale" ? "sale" : "rent and sale"}`,
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

export default async function PropertiesByTypeAndAreaPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; area: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { type, area } = await params;
  const queryParams = await searchParams;
  if (!VALID_TYPE_SLUGS.includes(type as (typeof VALID_TYPE_SLUGS)[number]) || !areas[area as MainArea]) {
    notFound();
  }
  const catalogType = type as CatalogTypeForSeo;
  const mainArea = area as MainArea;
  const areaInfo = areas[mainArea];
  const filters = parseQueryFilters(queryParams, catalogType, mainArea);
  const page = Math.max(1, parseInt(String(queryParams.page || "1"), 10) || 1);

  const all = await loadAllProperties();
  const filtered = filterProperties(all, filters);
  const { items: sortedProperties, total, totalPages, page: currentPage } = paginate(filtered, page);

  const featureKeyToProp: Record<string, keyof Property["features"]> = {
    hasBathtub: "bathtub",
    hasCarPark: "carPark",
    hasClosedKitchen: "closedKitchen",
    hasDesk: "desk",
    hasEnclosedLiving: "enclosedLivingArea",
    hasGarage: "garage",
    hasHighSpeedWifi: "highSpeedWifi",
    hasNatureView: "natureView",
    hasPetFriendly: "petFriendly",
    hasPool: "pool",
    hasWashingMachine: "washingMachine",
  };
  let propertiesForAmenities = filterProperties(all, { type: catalogType, mainArea });
  if (filters.subArea?.length) {
    propertiesForAmenities = propertiesForAmenities.filter(
      (p) => p.subArea && filters.subArea!.includes(p.subArea)
    );
  }
  if (filters.bedrooms?.length) {
    propertiesForAmenities = propertiesForAmenities.filter((p) =>
      filters.bedrooms!.includes(p.bedrooms)
    );
  }
  const availableAmenityFilterKeys = (Object.keys(featureKeyToProp) as string[]).filter((key) =>
    propertiesForAmenities.some((p) => p.features[featureKeyToProp[key]] === true)
  );

  const featureTexts: string[] = [];
  if (queryParams.hasBathtub === "true") featureTexts.push("with bathtub");
  if (queryParams.hasCarPark === "true") featureTexts.push("with car park");
  if (queryParams.hasClosedKitchen === "true") featureTexts.push("with enclosed kitchen");
  if (queryParams.hasDesk === "true") featureTexts.push("with desk");
  if (queryParams.hasEnclosedLiving === "true") featureTexts.push("with enclosed living");
  if (queryParams.hasGarage === "true") featureTexts.push("with garage");
  if (queryParams.hasHighSpeedWifi === "true") featureTexts.push("with high-speed WiFi");
  if (queryParams.hasNatureView === "true") featureTexts.push("with nature view");
  if (queryParams.hasPetFriendly === "true") featureTexts.push("with pet friendly");
  if (queryParams.hasPool === "true") featureTexts.push("with pool");
  if (queryParams.hasWashingMachine === "true") featureTexts.push("with washing machine");
  const featureText = featureTexts.length > 0 ? ` ${featureTexts.join(", ")}` : "";

  const basePath = `/properties/${catalogType}/${mainArea}`;
  const searchParamsForPagination: Record<string, string> = { ...queryParams } as Record<string, string>;
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://balitrusted.com";

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <link rel="canonical" href={`${baseUrl}${basePath}`} />
        <CatalogBreadcrumb
          type={catalogType as "rent" | "sale" | "villas" | "land" | "business"}
          area={mainArea}
          className="mb-3"
        />
        <CatalogStructuredData
          properties={sortedProperties}
          baseUrl={baseUrl}
          listName={`${propertyTypeNames[catalogType]} in ${areaInfo.nameEn}`}
        />
        {/* Area Header with Image */}
        {areaInfo.image && (
          <div className="relative w-full h-64 md:h-96 mb-3 rounded-lg overflow-hidden">
            <Image
              src={areaInfo.image}
              alt={areaInfo.nameEn}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {buildH1(catalogType, mainArea)}
                </h1>
                {featureText && (
                  <p className="text-xl md:text-2xl opacity-90">
                    {featureText}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {!areaInfo.image && (
          <div className="mb-3 rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-emerald-50/40 p-5 md:p-7 shadow-sm">
            <h1 className="text-2xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-2">
              {buildH1(catalogType, mainArea)}
            </h1>
            {featureText && (
              <p className="text-lg text-emerald-700 font-medium">
                {featureText}
              </p>
            )}
            <p className="text-gray-600 mt-4 text-base md:text-lg max-w-3xl">
              {areaInfo.description}
            </p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <PropertyFilters
              defaultType={catalogType === "villas" ? undefined : (catalogType as PropertyType)}
              defaultMainArea={mainArea}
              availableAmenityKeys={availableAmenityFilterKeys}
              baseVariant={catalogType === "land" ? "land" : catalogType === "business" ? "business" : "villas"}
            />

            {sortedProperties.length === 0 ? (
              <div className="space-y-6">
                <p className="text-sm text-gray-500">No properties match your criteria.</p>
                <CatalogFeedbackForm total={total} />
              </div>
            ) : (
              <>
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
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
                <Pagination
                  basePath={basePath}
                  page={currentPage}
                  totalPages={totalPages}
                  searchParams={searchParamsForPagination}
                />
                {total < 5 && (
                  <div className="mt-8">
                    <CatalogFeedbackForm total={total} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {total > 0 && (
          <div className="mt-16 max-w-3xl text-gray-600 text-sm leading-relaxed">
            {buildSeoText(catalogType, mainArea)}
          </div>
        )}
      </div>
    </div>
  );
}
