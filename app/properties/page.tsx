import { Metadata } from "next";
import { redirect } from "next/navigation";
import PropertyCard from "@/components/PropertyCard";
import Pagination from "@/components/Pagination";
import TopPageNumbers from "@/components/TopPageNumbers";
import CatalogBreadcrumb from "@/components/CatalogBreadcrumb";
import Link from "next/link";
import { buildIntro } from "@/lib/seoTemplates";
import CatalogFeedbackForm from "@/components/CatalogFeedbackForm";
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
  title: "All Bali Properties for Rent and Sale | Villas, Land and Investments",
  description:
    "Explore a curated selection of Bali properties including villas for rent, land plots, and investment opportunities. Discover homes across Ubud, Canggu, Seminyak and other Bali locations.",
};

export default async function PropertiesCatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;

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

  const searchParamsForPagination: Record<string, string> = {};
  Object.entries(query).forEach(([k, v]) => {
    if (k === "page") return;
    if (typeof v === "string") searchParamsForPagination[k] = v;
    else if (Array.isArray(v)) searchParamsForPagination[k] = v.join(",");
  });

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <CatalogBreadcrumb />
        <div className="mb-8 rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-emerald-50/40 p-5 md:p-7 shadow-sm">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-gray-900 mb-2">Properties</h1>
          <p className="text-gray-600 text-base md:text-lg max-w-3xl">
            {buildIntro()}
          </p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Choose property type</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/properties/villas"
              className="group rounded-2xl bg-white border border-gray-200 px-4 py-5 text-gray-900 hover:border-emerald-300 hover:shadow-sm transition-shadow"
            >
              <div className="text-base font-semibold mb-1">Villas</div>
              <div className="text-sm text-gray-500 group-hover:text-gray-700">Rent or buy</div>
            </Link>
            <Link
              href="/properties/land"
              className="group rounded-2xl bg-white border border-gray-200 px-4 py-5 text-gray-900 hover:border-emerald-300 hover:shadow-sm transition-shadow"
            >
              <div className="text-base font-semibold mb-1">Land</div>
              <div className="text-sm text-gray-500 group-hover:text-gray-700">Plots & investment</div>
            </Link>
            <Link
              href="/properties/business"
              className="group rounded-2xl bg-white border border-gray-200 px-4 py-5 text-gray-900 hover:border-emerald-300 hover:shadow-sm transition-shadow"
            >
              <div className="text-base font-semibold mb-1">Business</div>
              <div className="text-sm text-gray-500 group-hover:text-gray-700">Commercial opportunities</div>
            </Link>
          </div>
        </div>

        <div className="mt-10">
          <div className="mb-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 flex items-center justify-between gap-4">
            <div className="text-xs font-medium text-gray-600">
              Found {total} {total === 1 ? "property" : "properties"}
            </div>
            <TopPageNumbers
              basePath="/properties"
              page={currentPage}
              totalPages={totalPages}
              searchParams={searchParamsForPagination}
            />
          </div>

          {items.length === 0 ? (
            <div className="space-y-6">
              <p className="text-sm text-gray-500">No properties match your criteria.</p>
              <CatalogFeedbackForm total={total} />
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
