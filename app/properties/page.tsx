import { Metadata } from "next";
import PropertyCard from "@/components/PropertyCard";
import PropertyFilters from "@/components/PropertyFilters";
import Pagination from "@/components/Pagination";
import {
  loadAllProperties,
  filterProperties,
  paginate,
  CatalogFilters,
} from "@/lib/propertiesCatalog";
import { PropertyType, MainArea, SubArea } from "@/types/property";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Bali Properties for Rent and Sale | Villas, Land and Investments",
  description:
    "Explore a curated selection of Bali properties including villas for rent, land plots, and investment opportunities. Discover homes across Ubud, Canggu, Seminyak and other Bali locations.",
};

function parseQueryFilters(query: Record<string, string | string[] | undefined>): CatalogFilters {
  const filters: CatalogFilters = {};
  if (query.type && typeof query.type === "string") filters.type = query.type as PropertyType;
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

export default async function PropertiesCatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const filters = parseQueryFilters(query);
  const page = Math.max(1, parseInt(String(query.page || "1"), 10) || 1);

  const all = await loadAllProperties();
  const filtered = filterProperties(all, filters);
  const { items, total, totalPages, page: currentPage } = paginate(filtered, page);

  const searchParamsForPagination: Record<string, string> = {};
  if (filters.type) searchParamsForPagination.type = filters.type;
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
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Bali Properties for Rent and Sale
          </h1>
          <p className="text-gray-600">
            Explore our curated collection of properties across Bali.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <PropertyFilters />
          </aside>

          <div className="flex-1">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No properties found.</p>
                <p className="text-sm text-gray-500">Try adjusting your filters.</p>
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
                  basePath="/properties"
                  page={currentPage}
                  totalPages={totalPages}
                  searchParams={searchParamsForPagination}
                />
              </>
            )}
          </div>
        </div>

        <div className="mt-16 max-w-3xl text-gray-600 text-sm leading-relaxed">
          <p>
            Bali offers a wide range of real estate opportunities, from peaceful jungle villas in
            Ubud to modern coastal properties in Canggu and Seminyak. On this page you can browse a
            curated collection of properties available for rent and sale across the island. Our
            listings include private villas, land plots and unique investment opportunities suitable
            for both long-term living and property investment.
          </p>
          <p className="mt-4">
            Use filters to explore properties by location, number of bedrooms, rental terms and
            amenities such as private pools, enclosed living areas or nature views. Whether you are
            searching for a quiet home in the hills of Ubud or a vibrant property near Bali&apos;s
            beaches, our listings provide a convenient starting point for your search.
          </p>
        </div>
      </div>
    </div>
  );
}
