import type { Metadata } from "next";
import Link from "next/link";
import { loadAllProperties, loadAllPropertiesForSlugIndex } from "@/lib/propertiesCatalog";
import { buildPropertySlugIndex } from "@/lib/propertySlug";
import { getGlossaryTerms } from "@/lib/glossaryData";
import { getBlogPosts } from "@/lib/blogData";
import { glossaryCategoryLabel } from "@/lib/glossaryHub";
import HomePropertyCard from "@/components/HomePropertyCard";
import HomeLatestBlogPosts from "@/components/HomeLatestBlogPosts";

const HOME_LATEST_BLOG_COUNT = 5;

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://balitrusted.com";

export const metadata: Metadata = {
  title: "Bali Villa Rentals — Ubud, Sanur & Seminyak | Balitrusted",
  description:
    "Curated villas for rent in Bali with transparent pricing and practical listing details. Focus on Ubud, plus Sanur and Seminyak. Guides, Q&A, and help connecting with owners.",
  openGraph: {
    title: "Bali Villa Rentals — Ubud, Sanur & Seminyak | Balitrusted",
    description:
      "Curated villas for rent in Bali with transparent pricing and practical listing details. Focus on Ubud, plus Sanur and Seminyak. Guides, Q&A, and help connecting with owners.",
    url: siteUrl,
    siteName: "Balitrusted",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bali Villa Rentals — Ubud, Sanur & Seminyak | Balitrusted",
    description:
      "Curated villas for rent in Bali with transparent pricing and practical listing details. Focus on Ubud, plus Sanur and Seminyak. Guides, Q&A, and help connecting with owners.",
  },
};

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
  const daySeed = Math.floor(Date.now() / (1000 * 60 * 60 * 24)); // changes once per day

  const [allProperties, allForSlugs, glossaryTerms, blogPosts] = await Promise.all([
    loadAllProperties(),
    loadAllPropertiesForSlugIndex(),
    getGlossaryTerms(),
    getBlogPosts(),
  ]);

  const slugIdx = buildPropertySlugIndex(allForSlugs);
  const available = allProperties.filter((p) => !p.archived);
  const randomProperties = shuffle(available, daySeed).slice(0, 12);
  const wikiTerms = shuffle(glossaryTerms, daySeed + 17).slice(0, 4);
  const latestBlogPosts = [...blogPosts]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, HOME_LATEST_BLOG_COUNT);

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

      <HomeLatestBlogPosts posts={latestBlogPosts} />

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

      {wikiTerms.length > 0 && (
        <section className="py-8 border-t border-gray-100 bg-white">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
              <div>
                <h2 className="text-[1.375rem] font-bold text-gray-900">Bali Property Wiki</h2>
                <p className="text-sm text-gray-600 mt-1 max-w-2xl">
                  Learn the lingo: short definitions for common Bali property words, materials, and everyday villa topics.
                </p>
              </div>
              <Link
                href="/glossary"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-900 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap"
              >
                Browse all terms
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {wikiTerms.map((term) => (
                <Link
                  key={term.id}
                  href={`/glossary/${term.slug}`}
                  className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-emerald-900 leading-snug">
                      {term.title}
                    </h3>
                    <span className="shrink-0 text-[11px] uppercase tracking-wide text-gray-500 border border-gray-200 rounded-full px-2 py-0.5">
                      {glossaryCategoryLabel(term.category)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-3">{term.summary}</p>
                  <span className="mt-3 inline-block text-sm font-medium text-gray-900 group-hover:underline">
                    Read definition →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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
              We focus on villas suitable for long-term living, especially in popular areas such as Ubud, Sanur, Seminyak, and Kerobokan. These locations offer different lifestyles — from peaceful jungle surroundings to calmer coastal pockets.
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
