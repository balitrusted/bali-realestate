import Link from "next/link";
import { areas } from "@/types/areas";
import { loadAllProperties, loadAllPropertiesForSlugIndex } from "@/lib/propertiesCatalog";
import { buildPropertySlugIndex } from "@/lib/propertySlug";
import HomePropertyCard from "@/components/HomePropertyCard";

export const metadata = {
  title: "Bali Villas for Rent – Trusted Long Term Villa Rentals",
  description:
    "Browse trusted villas for rent in Bali. Long-term rentals in Ubud, Sanur and Canggu. Verified listings, transparent prices and local support.",
};

const POPULAR_AREAS = ["ubud", "sanur", "seminyak", "canggu"] as const;

/** Seeded shuffle so the homepage selection rotates daily without client randomness. */
function shuffle<T>(arr: T[], daySeed: number): T[] {
  let s = daySeed;
  const next = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default async function Home() {
  const allProperties = await loadAllProperties();
  const allForSlugs = await loadAllPropertiesForSlugIndex();
  const slugIdx = buildPropertySlugIndex(allForSlugs);
  const available = allProperties.filter((p) => !p.archived);
  const daySeed = Math.floor(Date.now() / (1000 * 60 * 60 * 24)); // changes once per day
  const randomProperties = shuffle(available, daySeed).slice(0, 12);

  return (
    <div className="bg-white">
      {/* Hero with Balinese-style header */}
      <section className="relative overflow-hidden">
        {/* Light semi-transparent background: gradient + subtle pattern */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "linear-gradient(165deg, rgba(250,250,248,0.98) 0%, rgba(236,243,236,0.95) 40%, rgba(245,248,242,0.98) 100%)",
          }}
        />
        <div
          className="absolute inset-0 z-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='none' stroke='%231a1a1a' stroke-width='0.5'/%3E%3C/svg%3E")`,
          }}
        />
        {/* Optional: hero image - light overlay for future use. For now gradient only. */}
        <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-[2rem] md:text-[2.5rem] font-bold text-gray-900 mb-4 leading-[1.15]">
              Villas, land and business for long-term rental and investment in Ubud and other areas of Bali.
            </h1>
            <p className="text-base text-gray-600 mb-6">
              Bridging the gap between you and Bali owners.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/properties"
                className="px-5 py-2.5 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors font-medium"
              >
                View properties
              </Link>
              <Link
                href="/request"
                className="px-5 py-2.5 border border-gray-300 text-gray-900 rounded-md hover:bg-gray-50 transition-colors font-medium"
              >
                List a property
              </Link>
              <Link
                href="/guides"
                className="px-5 py-2.5 border border-gray-300 text-gray-900 rounded-md hover:bg-gray-50 transition-colors font-medium"
              >
                Read our guides
              </Link>
              <Link
                href="/qa"
                className="px-5 py-2.5 border border-gray-300 text-gray-900 rounded-md hover:bg-gray-50 transition-colors font-medium"
              >
                Ask a question
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Random selection from catalog */}
      {randomProperties.length > 0 && (
        <section className="py-8 border-t border-gray-100">
          <div className="container mx-auto px-4">
            <h2 className="text-[1.375rem] font-bold text-gray-900 mb-4 text-center">
              Start exploring
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {randomProperties.map((property) => (
                <HomePropertyCard
                  key={property.id}
                  property={property}
                  detailSlug={slugIdx.segmentFor(property)}
                />
              ))}
            </div>
            <div className="text-center mt-4">
              <Link
                href="/properties"
                className="inline-block px-5 py-2.5 border border-gray-300 text-gray-900 rounded-md hover:bg-gray-50 transition-colors font-medium"
              >
                View all properties
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Popular Areas */}
      <section className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-[1.375rem] font-bold text-gray-900 mb-5 text-center">
            Popular Areas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {POPULAR_AREAS.map((areaId) => {
              const area = areas[areaId];
              return (
                <Link
                  key={areaId}
                  href={`/properties/rent/${areaId}`}
                  className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
                >
                  <span className="font-semibold text-gray-900">
                    {area.nameEn} Villas
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Start Here */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <h2 className="text-[1.375rem] font-bold text-gray-900 mb-5 text-center">
            Start Here
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Link
              href="/properties"
              className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Property Catalog
              </h3>
              <p className="text-gray-600 mb-3 text-sm">
                Carefully selected real estate in Bali for living and investment
              </p>
              <span className="text-gray-900 font-medium">View →</span>
            </Link>
            <Link
              href="/guides"
              className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Knowledge Base
              </h3>
              <p className="text-gray-600 mb-3 text-sm">
                Practical articles about rentals, purchases, legal aspects, and areas
              </p>
              <span className="text-gray-900 font-medium">Explore →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* For Whom */}
      <section className="bg-gray-50 py-10">
        <div className="container mx-auto px-4">
          <h2 className="text-[1.375rem] font-bold text-gray-900 mb-5 text-center">
            Who This Site Is For
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                For Long-Term Residents
              </h3>
              <p className="text-gray-600">
                For those looking for a calm, private home in Bali for a month or longer, with a focus on Ubud and nearby areas. More areas will be added over time.
              </p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                For Investors
              </h3>
              <p className="text-gray-600">
                Planning to invest in Bali real estate? Get honest information about risks, legal aspects, and real opportunities.
              </p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                For Conscious Clients
              </h3>
              <p className="text-gray-600">
                Want to understand the market before making a decision? Our knowledge base will help you avoid common mistakes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How We Differ */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-[1.375rem] font-bold text-gray-900 mb-5 text-center">
              How We Differ from Traditional Agencies
            </h2>
            <div className="space-y-4 text-gray-600 text-sm">
              <p>
                We don&apos;t just list properties — we offer a curated selection of villas for rent and sale, combined with practical tools and real market knowledge.
              </p>
              <p>
                Our focus is on long-term rentals and quality homes, especially in Ubud and nearby areas. Instead of aggressive sales, we prioritize informed decisions, verified listings, and transparency.
              </p>
              <p>
                Beyond the property catalog, we provide in-depth guides, answers to real questions, and personal support with property selection, legal aspects, and the rental or purchase process. Our goal is to help you make confident, well-grounded decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEO text */}
      <section className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto prose prose-gray">
            <p className="text-gray-700 leading-relaxed">
              Finding a villa for rent in Bali can be challenging. Prices vary, listings are scattered across Facebook groups, and many properties are outdated or unavailable.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Balitrusted was created to simplify the search for long-term villa rentals in Bali. Our platform brings together verified listings from local agents and property owners, making it easier for international residents, remote workers and long-term visitors to find a comfortable home on the island.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We focus on villas suitable for long-term living, especially in popular areas such as Ubud, Sanur and Canggu. These locations offer different lifestyles — from peaceful jungle surroundings to vibrant coastal communities.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Each listing includes detailed information about the property, location, price and availability. Our goal is to create a transparent and reliable catalog of villas where tenants can browse available homes and owners can reach international renters.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Whether you are moving to Bali for work, remote living or a longer stay, Balitrusted helps you explore available villas and connect with local agents for viewings and rental agreements.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
