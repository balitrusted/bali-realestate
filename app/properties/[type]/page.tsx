import { notFound } from "next/navigation";
import PropertyCard from "@/components/PropertyCard";
import PropertyFilters from "@/components/PropertyFilters";
import Pagination from "@/components/Pagination";
import {
  loadAllProperties,
  filterProperties,
  paginate,
  CatalogFilters,
} from "@/lib/propertiesCatalog";
import { buildTitle, buildH1, buildDescription, buildSeoText } from "@/lib/seoTemplates";
import { PropertyType, MainArea, SubArea } from "@/types/property";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const propertyTypeNames: Record<PropertyType, string> = {
  rent: "Rent",
  sale: "Buy",
  land: "Land",
  business: "Business",
};

const propertyTypeVerbs: Record<PropertyType, string> = {
  rent: "Rent",
  sale: "Buy",
  land: "Buy",
  business: "Buy",
};

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const propertyType = type as PropertyType;
  if (!propertyTypeNames[propertyType]) {
    return { title: "Properties Not Found" };
  }
  const all = await loadAllProperties();
  const filtered = filterProperties(all, { type: propertyType });
  const noIndex = filtered.length === 0;
  return {
    title: buildTitle(propertyType),
    description: buildDescription(propertyType),
    robots: noIndex ? { index: false, follow: true } : { index: true, follow: true },
  };
}

function parseQueryFilters(
  query: Record<string, string | string[] | undefined>,
  type: PropertyType
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
  const propertyType = type as PropertyType;

  if (!propertyTypeNames[propertyType]) {
    notFound();
  }

  const filters = parseQueryFilters(query, propertyType);
  const page = Math.max(1, parseInt(String(query.page || "1"), 10) || 1);

  const all = await loadAllProperties();
  const filtered = filterProperties(all, filters);
  const { items, total, totalPages, page: currentPage } = paginate(filtered, page);

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

  const verb = propertyTypeVerbs[propertyType];
  const subject = propertyType === "rent" ? "Villas" : propertyType === "sale" ? "Villas" : propertyType === "land" ? "Land" : "Business";

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {buildH1(propertyType)}
          </h1>
          <p className="text-gray-600">
            Browse {subject.toLowerCase()} for {verb.toLowerCase()} across Bali.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <PropertyFilters defaultType={propertyType} />
          </aside>

          <div className="flex-1">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No properties found in this category.</p>
                <p className="text-sm text-gray-500">Try other areas or filters.</p>
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
                  basePath={`/properties/${propertyType}`}
                  page={currentPage}
                  totalPages={totalPages}
                  searchParams={searchParamsForPagination}
                />
              </>
            )}
          </div>
        </div>

        <div className="mt-16 max-w-3xl text-gray-600 text-sm leading-relaxed">
          {buildSeoText(propertyType)}
        </div>
      </div>
    </div>
  );
}
