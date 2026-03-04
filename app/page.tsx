import Link from "next/link";
import { areas } from "@/types/areas";

export const metadata = {
  title: "Bali Villas for Rent – Trusted Long Term Villa Rentals",
  description:
    "Browse trusted villas for rent in Bali. Long-term rentals in Ubud, Sanur and Canggu. Verified listings, transparent prices and local support.",
};

const POPULAR_AREAS = ["ubud", "sanur", "seminyak", "canggu"] as const;

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Real Estate in Bali for Long-term Living and Investments
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            No noise. No spam. No tourist approach.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/properties"
              className="px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              View Properties
            </Link>
            <Link
              href="/qa"
              className="px-6 py-3 border border-gray-300 text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
            >
              Ask a Question
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Areas */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Popular Areas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {POPULAR_AREAS.map((areaId) => {
              const area = areas[areaId];
              return (
                <Link
                  key={areaId}
                  href={`/properties/rent/${areaId}`}
                  className="bg-white p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
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
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Start Here
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link
              href="/properties"
              className="bg-gray-50 p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Property Catalog
              </h3>
              <p className="text-gray-600 mb-4">
                Carefully selected real estate in Bali for living and investment
              </p>
              <span className="text-gray-900 font-medium">View →</span>
            </Link>
            <Link
              href="/guides"
              className="bg-gray-50 p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Knowledge Base
              </h3>
              <p className="text-gray-600 mb-4">
                Practical articles about rentals, purchases, legal aspects, and areas
              </p>
              <span className="text-gray-900 font-medium">Explore →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* For Whom */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Who This Site Is For
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                For Long-Term Residents
              </h3>
              <p className="text-gray-600">
                For those looking for a calm, private home in Bali for a month or longer, with a focus on Ubud and nearby areas. More areas will be added over time.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                For Investors
              </h3>
              <p className="text-gray-600">
                Planning to invest in Bali real estate? Get honest information about risks, legal aspects, and real opportunities.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
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
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              How We Differ from Traditional Agencies
            </h2>
            <div className="space-y-6 text-gray-600">
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
      <section className="bg-gray-50 py-12">
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
