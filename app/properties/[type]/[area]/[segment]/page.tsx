import { notFound } from "next/navigation";
import { Metadata } from "next";
import PropertyCard from "@/components/PropertyCard";
import PropertyFilters from "@/components/PropertyFilters";
import Pagination from "@/components/Pagination";
import CatalogStructuredData from "@/components/CatalogStructuredData";
import {
  loadAllProperties,
  filterProperties,
  paginate,
  parseSegment,
  CatalogFilters,
  areas,
} from "@/lib/propertiesCatalog";
import { buildTitle, buildH1, buildDescription, buildSeoText } from "@/lib/seoTemplates";
import { PropertyType, MainArea, SubArea } from "@/types/property";
import Image from "next/image";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const propertyTypeNames: Record<PropertyType, string> = {
  rent: "Rent",
  sale: "Buy",
  land: "Land",
  business: "Business",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string; area: string; segment: string }>;
}): Promise<Metadata> {
  const { type, area, segment } = await params;
  const propertyType = type as PropertyType;
  const mainArea = area as MainArea;

  if (!propertyTypeNames[propertyType] || !areas[mainArea]) {
    return { title: "Properties Not Found" };
  }

  const parsed = parseSegment(segment, mainArea, propertyType);
  if (!parsed) {
    return { title: "Properties Not Found" };
  }

  const subArea = parsed.kind === "subArea" ? (parsed.value as SubArea) : undefined;
  const all = await loadAllProperties();
  const filtered = filterProperties(all, { type: propertyType, mainArea }, parsed);
  const noIndex = filtered.length === 0;

  return {
    title: buildTitle(propertyType, mainArea, subArea, parsed),
    description: buildDescription(propertyType, mainArea, subArea, parsed),
    robots: noIndex ? { index: false, follow: true } : { index: true, follow: true },
  };
}

function parseQueryFilters(
  query: Record<string, string | string[] | undefined>,
  type: PropertyType,
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
  const propertyType = type as PropertyType;
  const mainArea = area as MainArea;

  if (!propertyTypeNames[propertyType] || !areas[mainArea]) {
    notFound();
  }

  const parsed = parseSegment(segment, mainArea, propertyType);
  if (!parsed) {
    notFound();
  }

  const filters = parseQueryFilters(query, propertyType, mainArea);
  const page = Math.max(1, parseInt(String(query.page || "1"), 10) || 1);

  const all = await loadAllProperties();
  const filtered = filterProperties(all, filters, parsed);
  const { items, total, totalPages, page: currentPage } = paginate(filtered, page);

  const subArea = parsed.kind === "subArea" ? (parsed.value as SubArea) : undefined;
  const areaInfo = areas[mainArea];
  const basePath = `/properties/${propertyType}/${mainArea}/${segment}`;

  const searchParamsForPagination: Record<string, string> = { ...query } as Record<string, string>;
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

  const featureKeyToProp: Record<string, keyof import("@/types/property").Property["features"]> = {
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
  let propertiesForAmenities = filterProperties(all, { type: propertyType, mainArea }, parsed);
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://balitrusted.com";

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <link rel="canonical" href={`${baseUrl}${basePath}`} />
        {items.length > 0 && (
          <CatalogStructuredData
            properties={items}
            baseUrl={baseUrl}
            listName={buildH1(propertyType, mainArea, subArea, parsed)}
          />
        )}
        {areaInfo.image && (
          <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
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
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                  {buildH1(propertyType, mainArea, subArea, parsed)}
                </h1>
              </div>
            </div>
          </div>
        )}

        {!areaInfo.image && (
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {buildH1(propertyType, mainArea, subArea, parsed)}
            </h1>
            <p className="text-gray-600 mt-4">{areaInfo.description}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <PropertyFilters
              defaultType={propertyType}
              defaultMainArea={mainArea}
              availableAmenityKeys={availableAmenityFilterKeys}
            />
          </aside>

          <div className="flex-1">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No properties found in this category.</p>
                <p className="text-sm text-gray-500">Try other filters or areas.</p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  Found {total} {total === 1 ? "property" : "properties"}
                  {totalPages > 1 && ` · Page ${currentPage} of ${totalPages}`}
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {items.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
                <Pagination
                  basePath={basePath}
                  page={currentPage}
                  totalPages={totalPages}
                  searchParams={searchParamsForPagination}
                />
              </>
            )}
          </div>
        </div>

        {total > 0 && (
          <div className="mt-16 max-w-3xl text-gray-600 text-sm leading-relaxed">
            {buildSeoText(propertyType, mainArea, subArea, parsed)}
          </div>
        )}
      </div>
    </div>
  );
}
