import Link from "next/link";
import { areas } from "@/types/areas";
import { getGlossaryTerms } from "@/lib/glossaryData";

export const metadata = {
  title: "Sitemap",
  description:
    "Full sitemap of Balitrusted: property catalog, map, glossary, villas for rent and sale, knowledge base, Q&A, and main pages.",
};

const propertyTypes = [
  { value: "rent", label: "Rent" },
  { value: "sale", label: "Buy" },
  { value: "land", label: "Land" },
  { value: "business", label: "Business" },
];

const guideCategories = [
  { slug: "rent", title: "Long-term rental" },
  { slug: "buy", title: "Purchase and Investments" },
  { slug: "land", title: "Land" },
  { slug: "legal", title: "Legal and Safety" },
  { slug: "ubud", title: "Ubud" },
  { slug: "areas", title: "Other Areas" },
  { slug: "risks", title: "Mistakes and Reality" },
];

const mainAreas = [
  { value: "ubud", label: areas.ubud.nameEn },
  { value: "canggu", label: areas.canggu.nameEn },
  { value: "sanur", label: areas.sanur.nameEn },
];

export default async function SitemapPage() {
  const glossaryTerms = await getGlossaryTerms();

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Sitemap
          </h1>
          <p className="text-lg text-gray-600 mb-10">
            All main pages and sections of Balitrusted. Use this map to find what you need or for SEO reference.
          </p>

          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Main
              </h2>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-700 hover:text-gray-900 hover:underline">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-gray-700 hover:text-gray-900 hover:underline">
                    About This Project
                  </Link>
                </li>
                <li>
                  <Link href="/services" className="text-gray-700 hover:text-gray-900 hover:underline">
                    Services
                  </Link>
                </li>
                <li>
                  <Link href="/request" className="text-gray-700 hover:text-gray-900 hover:underline">
                    Send Request
                  </Link>
                </li>
                <li>
                  <Link href="/qa" className="text-gray-700 hover:text-gray-900 hover:underline">
                    Q&A
                  </Link>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Property Catalog
              </h2>
              <ul className="space-y-2 mb-6">
                <li>
                  <Link href="/properties" className="text-gray-700 hover:text-gray-900 hover:underline">
                    All Properties
                  </Link>
                </li>
              </ul>
              <div className="space-y-4">
                {propertyTypes.map((type) => (
                  <div key={type.value}>
                    <h3 className="text-sm font-medium text-gray-800 mb-2">
                      {type.label}
                    </h3>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <li>
                        <Link
                          href={`/properties/${type.value}`}
                          className="text-gray-600 hover:text-gray-900 hover:underline"
                        >
                          By area
                        </Link>
                      </li>
                      {mainAreas.map((area) => (
                        <li key={area.value}>
                          <Link
                            href={`/properties/${type.value}/${area.value}`}
                            className="text-gray-600 hover:text-gray-900 hover:underline"
                          >
                            {area.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/properties/map" className="text-gray-700 hover:text-gray-900 hover:underline">
                    Property map
                  </Link>
                  <span className="text-sm text-gray-500 ml-2">— listings with coordinates, same filters as catalog</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Glossary
              </h2>
              <ul className="space-y-2 mb-4">
                <li>
                  <Link href="/glossary" className="text-gray-700 hover:text-gray-900 hover:underline">
                    Glossary hub (A–Z)
                  </Link>
                </li>
              </ul>
              {glossaryTerms.length > 0 ? (
                <ul className="space-y-1.5 text-sm columns-1 sm:columns-2 gap-x-8">
                  {glossaryTerms.map((t) => (
                    <li key={t.id} className="break-inside-avoid">
                      <Link
                        href={`/glossary/${t.slug}`}
                        className="text-gray-600 hover:text-gray-900 hover:underline"
                      >
                        {t.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No published terms yet.</p>
              )}
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Knowledge Base
              </h2>
              <ul className="space-y-2 mb-4">
                <li>
                  <Link href="/guides" className="text-gray-700 hover:text-gray-900 hover:underline">
                    All categories
                  </Link>
                </li>
              </ul>
              <ul className="space-y-2">
                {guideCategories.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/guides/${cat.slug}`}
                      className="text-gray-600 hover:text-gray-900 hover:underline"
                    >
                      {cat.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>
              XML sitemap for search engines:{" "}
              <Link href="/sitemap.xml" className="text-gray-700 hover:underline">
                /sitemap.xml
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
