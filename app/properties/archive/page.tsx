import { Metadata } from "next";
import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import Pagination from "@/components/Pagination";
import CatalogBreadcrumb from "@/components/CatalogBreadcrumb";
import CatalogListingDivider from "@/components/CatalogListingDivider";
import { loadAllPropertiesForSlugIndex, paginate } from "@/lib/propertiesCatalog";
import { buildPropertySlugIndex } from "@/lib/propertySlug";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Archived villas in Bali | Balitrusted",
  description:
    "Browse archived Bali villas that are currently not available. Explore past listings and request similar options from our team.",
};

export default async function ArchivedVillasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const page = Math.max(1, parseInt(String(query.page || "1"), 10) || 1);

  const allForSlugs = await loadAllPropertiesForSlugIndex();
  const archivedVillas = allForSlugs.filter(
    (p) => !!p.archived && (p.types?.includes("rent") || p.types?.includes("sale"))
  );
  const slugIdx = buildPropertySlugIndex(allForSlugs);
  const { items, total, totalPages, page: currentPage } = paginate(archivedVillas, page);

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <CatalogBreadcrumb className="mb-3" segmentLabel="Archived villas" />
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50/60 px-4 py-3 text-sm text-rose-800">
          These villas are currently not available. You can still open each page and send a request for similar options.
        </div>

        <div className="mb-4 rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-rose-50/40 p-5 md:p-7 shadow-sm">
          <h1 className="text-2xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-2">
            Archived villas
          </h1>
          <p className="text-sm text-gray-600 max-w-3xl leading-relaxed">
            This archive stays indexable as a reference library of past villa listings in Bali. If a villa is not
            available, use its detail page to request alternatives.
          </p>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No archived villas yet.</p>
        ) : (
          <>
            <CatalogListingDivider className="my-6" />
            <Pagination
              basePath="/properties/archive"
              page={currentPage}
              totalPages={totalPages}
              navClassName="flex justify-center items-center gap-2 mt-0 mb-2"
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((property) => (
                <PropertyCard key={property.id} property={property} detailSlug={slugIdx.segmentFor(property)} />
              ))}
            </div>
            <Pagination basePath="/properties/archive" page={currentPage} totalPages={totalPages} />
            <div className="mt-10 text-sm text-gray-600">
              Need something similar but available now?{" "}
              <Link href="/request" className="text-emerald-800 underline hover:text-emerald-900">
                Send request
              </Link>
              .
            </div>
          </>
        )}
        {total > 0 && (
          <p className="mt-10 text-sm text-gray-500">
            {total} archived {total === 1 ? "villa" : "villas"} in the library.
          </p>
        )}
      </div>
    </div>
  );
}
