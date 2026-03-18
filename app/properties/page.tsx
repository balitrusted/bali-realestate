import { Metadata } from "next";
import { redirect } from "next/navigation";
import PropertyCard from "@/components/PropertyCard";
import PropertyFilters from "@/components/PropertyFilters";
import Pagination from "@/components/Pagination";
import CatalogWizard from "@/components/CatalogWizard";
import CatalogFiltersToggle from "@/components/CatalogFiltersToggle";
import CatalogFeedbackForm from "@/components/CatalogFeedbackForm";
import CatalogBreadcrumb from "@/components/CatalogBreadcrumb";
import {
  loadAllProperties,
  filterProperties,
  paginate,
  CatalogFilters,
} from "@/lib/propertiesCatalog";
import { buildIntro } from "@/lib/seoTemplates";
import { PropertyType, MainArea, SubArea } from "@/types/property";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAIN_AREAS_ORDER: MainArea[] = ["ubud", "canggu", "sanur", "seminyak", "tanah-lot"];

export const metadata: Metadata = {
  title: "All Bali Properties for Rent and Sale | Villas, Land and Investments",
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
  // Redirect old ?subject=villas to clean URL /properties/villas
  const onlySubjectVillas =
    query.subject === "villas" &&
    !query.type &&
    !query.mainArea &&
    !query.subArea &&
    !query.bedrooms &&
    !query.minDuration &&
    !query.maxPrice &&
    query.both !== "1" &&
    ["hasBathtub", "hasCarPark", "hasClosedKitchen", "hasDesk", "hasEnclosedLiving", "hasGarage", "hasHighSpeedWifi", "hasNatureView", "hasPetFriendly", "hasPool", "hasWashingMachine"].every((k) => query[k] !== "true");
  if (onlySubjectVillas) {
    const page = String(query.page || "1");
    redirect(`/properties/villas${page !== "1" ? `?page=${page}` : ""}`);
  }
  // Canonical URL for "both" (rent + sale): use path /properties/villas instead of ?both=1
  const onlyBoth =
    query.both === "1" &&
    !query.type &&
    !query.mainArea &&
    !query.subArea &&
    !query.bedrooms &&
    !query.minDuration &&
    !query.maxPrice &&
    ["hasBathtub", "hasCarPark", "hasClosedKitchen", "hasDesk", "hasEnclosedLiving", "hasGarage", "hasHighSpeedWifi", "hasNatureView", "hasPetFriendly", "hasPool", "hasWashingMachine"].every(
      (k) => query[k] !== "true"
    );
  if (onlyBoth) {
    const page = String(query.page || "1");
    redirect(`/properties/villas${page !== "1" ? `?page=${page}` : ""}`);
  }

  const filters = parseQueryFilters(query);
  const page = Math.max(1, parseInt(String(query.page || "1"), 10) || 1);
  const hasBoth = query.both === "1";

  const all = await loadAllProperties();
  const effectiveFilters: CatalogFilters = hasBoth ? { ...filters, type: "villas" as const } : filters;
  const filtered = filterProperties(all, effectiveFilters);
  const { items, total, totalPages, page: currentPage } = paginate(filtered, page);

  const availableMainAreas = MAIN_AREAS_ORDER.filter((area) =>
    filtered.some((p) => p.mainArea === area)
  );

  const searchParamsForPagination: Record<string, string> = {};
  if (filters.type) searchParamsForPagination.type = filters.type;
  if (query.both === "1") searchParamsForPagination.both = "1";
  if (filters.mainArea) searchParamsForPagination.mainArea = filters.mainArea;
  if (query.areaDone === "1") searchParamsForPagination.areaDone = "1";
  if (query.bedroomsDone === "1") searchParamsForPagination.bedroomsDone = "1";
  if (query.amenitiesDone === "1") searchParamsForPagination.amenitiesDone = "1";
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
        <CatalogBreadcrumb />
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            All Bali Properties for Rent and Sale
          </h1>
          <p className="text-gray-600">
            {buildIntro()}
          </p>
        </div>

        <div className="space-y-6">
          <CatalogFiltersToggle>
            <PropertyFilters />
          </CatalogFiltersToggle>

          <div>
            <CatalogWizard availableMainAreas={availableMainAreas} />

            {items.length === 0 ? (
              <div className="space-y-6">
                <p className="text-sm text-gray-500">No properties match your criteria.</p>
                <CatalogFeedbackForm total={total} />
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
                {(total < 5 || total === 0) && (
                  <div className="mt-8">
                    <CatalogFeedbackForm total={total} />
                  </div>
                )}
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
