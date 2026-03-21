import { PropertyType, MainArea } from "@/types/property";
import { areas, subAreaNames } from "@/types/areas";
import { SubArea } from "@/types/property";

export type CatalogTypeForSeo = PropertyType | "villas";

const typeLabels: Record<string, string> = {
  rent: "Rent",
  sale: "Buy",
  land: "Land",
  business: "Business",
  villas: "Rent or Buy",
};

const subjectByType: Record<string, string> = {
  rent: "Villas",
  sale: "Villas",
  land: "Land",
  business: "Business",
  villas: "Villas",
};

const areaName = (a: MainArea) => areas[a]?.nameEn ?? a;

export function buildTitle(
  type: CatalogTypeForSeo,
  area?: MainArea,
  subArea?: SubArea,
  segment?: { kind: string | null; value: string | number }
): string {
  if (type === "villas" && !segment) {
    if (area) return `All Villas in ${areaName(area)} | Rent or Buy | Balitrusted`;
    return "All Villas for Rent & Sale in Bali | Balitrusted";
  }
  const subject = subjectByType[type] ?? "Villas";
  const verb = typeLabels[type] ?? "Rent";
  const loc = area ? areaName(area) : "Bali";
  const sub = subArea ? ` in ${subAreaNames[subArea]}` : "";

  if (segment?.kind === "bedroom") {
    return `${segment.value} Bedroom ${subject} for ${verb} in ${loc}${sub} | Balitrusted`;
  }
  if (segment?.kind === "payment") {
    const pay = segment.value === "yearly" ? "Yearly" : "Monthly";
    return `${subject} for ${verb} ${pay} in ${loc}${sub} | Balitrusted`;
  }
  if (segment?.kind === "amenity") {
    const amenityLabel = (segment.value as string).replace(/-/g, " ");
    return `${subject} with ${amenityLabel} for ${verb} in ${loc}${sub} | Balitrusted`;
  }
  if (segment?.kind === "subArea") {
    return `${subject} for ${verb} in ${subAreaNames[subArea!]} | Balitrusted`;
  }
  if (area) {
    return `${subject} for ${verb} in ${loc} | Balitrusted`;
  }
  if (type === "rent") {
    return "Villas for Rent in Bali | Long-Term Rentals | Balitrusted";
  }
  if (type === "sale") {
    return "Villas for Sale in Bali | Balitrusted";
  }
  if (type) {
    return `${subject} for ${verb} in Bali | Balitrusted`;
  }
  return "All Bali Properties for Rent and Sale | Villas, Land and Investments - Balitrusted";
}

export function buildH1(
  type: CatalogTypeForSeo,
  area?: MainArea,
  subArea?: SubArea,
  segment?: { kind: string | null; value: string | number }
): string {
  if (type === "villas" && !segment) {
    if (area) return `All villas in ${areaName(area)}`;
    return "All villas";
  }
  const subject = subjectByType[type] ?? "Villas";
  const verb = typeLabels[type] ?? "Rent";
  const loc = area ? areaName(area) : "Bali";
  const sub = subArea ? ` in ${subAreaNames[subArea]}` : "";

  if (segment?.kind === "bedroom") {
    return `${segment.value} Bedroom ${subject} for ${verb} in ${loc}${sub}`;
  }
  if (segment?.kind === "payment") {
    const pay = segment.value === "yearly" ? "Yearly" : "Monthly";
    return `${subject} for ${verb} ${pay} in ${loc}${sub}`;
  }
  if (segment?.kind === "amenity") {
    const amenityLabel = (segment.value as string).replace(/-/g, " ");
    return `${subject} with ${amenityLabel} for ${verb} in ${loc}${sub}`;
  }
  if (segment?.kind === "subArea") {
    return `${subject} for ${verb} in ${subAreaNames[subArea!]}`;
  }
  if (area) {
    return `${subject} for ${verb} in ${loc}`;
  }
  if (type === "rent") {
    return "Villas for rent in Bali";
  }
  if (type === "sale") {
    return "Villas for sale in Bali";
  }
  if (type) {
    return `${subject} for ${verb} in Bali`;
  }
  return "Bali Properties for Rent and Sale";
}

/** Short intro line for the top of the catalog page (visible block under H1). */
export function buildIntro(
  type?: CatalogTypeForSeo | null,
  area?: MainArea,
  segment?: { kind: string | null; value: string | number }
): string {
  if (!type) {
    return "Explore our curated collection of properties across Bali.";
  }
  if (type === "villas" && !area && !segment) {
    return "Here you'll find every villa currently in our catalogue—available for long-term rent or for purchase. We refresh listings as they change. Use the filters to narrow by area, bedrooms, budget, and amenities, or browse the full set below.";
  }
  if (type === "rent" && !area && !segment) {
    return "Compare long-term villas for rent in Bali—verified listings with clear pricing. Ready to rent a villa in Bali for a month or longer? Filter by area, bedrooms, pool, enclosed living, payment terms, and more.";
  }
  if (type === "sale" && !area && !segment) {
    return "Explore villas for sale in Bali in one curated catalogue. Planning to buy a villa in Bali for living or investment? Filter by area, size, features, and ownership context—then shortlist what fits your budget.";
  }
  if (type === "land" && !area) {
    return "Browse land for sale in Bali. Find plots for building or investment.";
  }
  if (type === "business" && !area) {
    return "Explore business and commercial properties in Bali.";
  }
  const loc = area ? areaName(area) : "Bali";
  const subject = (subjectByType[type] ?? "villas").toLowerCase();
  if (area && !segment) {
    return `Find ${subject} for ${typeLabels[type]?.toLowerCase() ?? type} in ${loc}. Use filters to narrow your search.`;
  }
  if (segment?.kind === "bedroom") {
    return `${segment.value} bedroom ${subject} in ${loc}. Browse listings and filter by amenities.`;
  }
  if (segment?.kind === "payment") {
    const pay = segment.value === "yearly" ? "yearly" : "monthly";
    return `${subject} for ${pay} payment in ${loc}.`;
  }
  if (segment?.kind === "amenity") {
    const amenityLabel = (segment.value as string).replace(/-/g, " ");
    return `${subject} with ${amenityLabel} in ${loc}.`;
  }
  return `Browse our curated selection in ${loc}.`;
}

export function buildDescription(
  type: CatalogTypeForSeo,
  area?: MainArea,
  subArea?: SubArea,
  segment?: { kind: string | null; value: string | number }
): string {
  if (type === "villas" && !segment) {
    if (area) {
      const areaDesc = areas[area]?.seoDescription ?? areas[area]?.description ?? "";
      return areaDesc || `Browse villas for rent and sale in ${areaName(area)}. Find your next home or investment.`;
    }
    return "Browse all villas for rent and for sale in Bali—one catalogue, regularly updated. Long-term rentals and purchase options across Ubud, Canggu, Sanur, Seminyak and more.";
  }
  const subject = (subjectByType[type] ?? "villas").toLowerCase();
  const loc = area ? areaName(area) : "Bali";
  const areaDesc = area ? areas[area]?.seoDescription ?? areas[area]?.description : "";

  if (segment?.kind === "bedroom") {
    return `Find ${segment.value} bedroom ${subject} for ${type} in ${loc}. ${areaDesc || `Browse our curated selection of properties in ${loc}.`}`;
  }
  if (segment?.kind === "payment") {
    const pay = segment.value === "yearly" ? "yearly" : "monthly";
    return `Browse ${subject} available for ${pay} payment in ${loc}. ${areaDesc || ""}`;
  }
  if (segment?.kind === "amenity") {
    const amenityLabel = (segment.value as string).replace(/-/g, " ");
    return `Find ${subject} with ${amenityLabel} in ${loc}. ${areaDesc || ""}`;
  }
  if (segment?.kind === "subArea") {
    return `Discover ${subject} in ${subAreaNames[subArea!]}, ${loc}. ${areaDesc || ""}`;
  }
  if (area) {
    return areaDesc || `Find ${subject} in ${loc}. Browse our curated listings.`;
  }
  if (type === "rent") {
    return "Villas for rent in Bali: long-term listings with clear filters. Rent a villa in Bali for a month or more—by area, bedrooms, pool, enclosed living, payment terms and more.";
  }
  if (type === "sale") {
    return "Villas for sale in Bali in one curated catalogue. Buy a villa in Bali with realistic context—freehold and leasehold options in Ubud, Canggu, Seminyak, Tanah Lot and beyond.";
  }
  if (type) {
    return `Browse ${subject} in Bali. Find properties across Ubud, Canggu, Sanur and more.`;
  }
  return "Explore a curated selection of Bali properties including villas for rent, land plots, and investment opportunities. Discover homes across Ubud, Canggu, Seminyak and other Bali locations.";
}

/** Unique SEO texts for level-1 type-only pages (e.g. /properties/rent, /properties/sale, /properties/villas). */
const seoTextByType: Record<string, string> = {
  rent: `Looking for a villa to rent in Bali? This page lists private villas available for long-term rental across the island — from Ubud and the central highlands to coastal areas like Canggu, Seminyak and Sanur. All listings are verified and suitable for stays of one month or more. You can filter by area, number of bedrooms, payment terms (monthly or yearly) and amenities such as private pool, enclosed kitchen, bathtub or nature view. Whether you need a one-bedroom for remote work or a family villa with several bedrooms, our catalog helps you find a rental that fits your budget and lifestyle.`,
  sale: `Interested in buying a villa or house in Bali? Here you can browse villas for sale across the island. Our listings include freehold and leasehold options in popular areas like Ubud, Canggu, Seminyak and Tanah Lot. Use the filters to narrow by location, size and features. Buying property in Bali involves specific legal and permit requirements; we recommend consulting our guides and specialists before making a decision.`,
  villas: `Looking for a villa in Bali — to rent or to buy? This hub lists all villas available for both long-term rental and purchase across the island. You can choose monthly or yearly rent where offered, or explore purchase options. Filter by area (Ubud, Canggu, Sanur, Seminyak, Tanah Lot), bedrooms, and amenities such as pool, bathtub or enclosed kitchen. Whether you plan to rent for a few months or invest, our catalogue helps you find the right villa.`,
  land: `Searching for land for sale in Bali? This page shows land plots available for purchase in different areas of the island. Land listings may be suitable for building a villa, developing a small project or long-term investment. Locations range from the green hills of Ubud to coastal zones. Always verify zoning, permits and ownership structure with a qualified professional before committing.`,
  business: `Exploring business property or commercial opportunities in Bali? This section lists properties that can be used for business — guesthouses, small hotels, cafes or other ventures. Listings may include villas with tourist accommodation permits or land suitable for commercial use. Check each listing and local regulations to ensure the property fits your business plan.`,
};

/**
 * Multi-paragraph SEO footer for type hub pages only: /properties/villas, /rent, /sale.
 * Area and segment pages keep using {@link buildSeoText}.
 */
export function buildTypeHubFooterParagraphs(type: CatalogTypeForSeo): string[] | null {
  if (type === "villas") {
    return [
      "If you are looking for a villa in Bali—to rent for a longer stay or to buy—this hub lists every villa currently in our public catalogue. Listings combine long-term rental options (monthly or yearly where offered) with properties offered for purchase, so you can compare approaches in one place rather than jumping between separate directories.",
      "Filter by area such as Ubud, Canggu, Sanur, Seminyak or Tanah Lot, by number of bedrooms, by rental or payment preferences, and by amenities including private pool, bathtub, enclosed kitchen, enclosed living, nature views, garage or car park, desk space, and more. The goal is practical browsing: fewer surprises, clearer expectations.",
      "We update the catalogue as listings change and details are verified. Whether you already know Ubud well or are weighing hills against the coast, the same tools help you move from exploration to a manageable shortlist.",
    ];
  }
  if (type === "rent") {
    return [
      "Villas for rent in Bali are easy to find online—but hard to trust when photos, prices, and contract terms do not line up. This page focuses on long-term villas for rent in Bali: private homes suited to stays of one month or more, with information we aim to keep accurate and useful.",
      "When you decide to rent a villa in Bali, the right filters save time: choose an area and sub-area, bedroom count, monthly or yearly payment where available, and must-have features such as a pool, enclosed kitchen, high-speed Wi-Fi, bathtub, or nature views. Compare Ubud's jungle calm with coastal energy in Canggu, Seminyak, or Sanur depending on your routine.",
      "Renting long-term still means reading contracts carefully and confirming what is included—utilities, cleaning, pool maintenance, and deposit terms. Browse here at your own pace; if you want a curated shortlist or have fixed dates and budget, we can help you connect the dots between villas for rent in Bali and a place that actually fits how you want to rent a villa in Bali.",
    ];
  }
  if (type === "sale") {
    return [
      "Villas for sale in Bali range from compact one-bedroom homes to large multi-bedroom estates, across freehold and leasehold structures and many price bands. This catalogue highlights properties we represent with clear presentation—so you can compare seriously before engaging lawyers and notaries on the ground.",
      "If you plan to buy a villa in Bali, map your priorities first: location, land and building size, pool, enclosed living for climate control, views, parking, and whether the listing fits residential use, mixed use, or investment strategy. Use filters to narrow villas for sale in Bali by area and features, then review each detail page for pricing context and next steps.",
      "Purchasing property in Indonesia involves permits, ownership structures, and tax questions that vary by case. We recommend specialist legal advice before you commit. When you are still in research mode, use this page to understand what shapes the current market for villas for sale in Bali—and what it really takes to buy a villa in Bali with confidence.",
    ];
  }
  return null;
}

export function buildSeoText(
  type: CatalogTypeForSeo,
  area?: MainArea,
  subArea?: SubArea,
  segment?: { kind: string | null; value: string | number }
): string {
  if (type === "villas" && !segment) {
    if (area) return `${areaName(area)} is one of Bali's most sought-after areas for villas. Whether you want to rent or buy, this page lists villas in ${areaName(area)}. Use filters to narrow by bedrooms, payment terms and amenities. ${seoTextByType.villas}`;
    return seoTextByType.villas;
  }
  const subject = (subjectByType[type] ?? "villas").toLowerCase();
  const loc = area ? areaName(area) : "Bali";
  const base = `Bali offers a wide range of real estate opportunities, from peaceful jungle villas in Ubud to modern coastal properties in Canggu and Seminyak. On this page you can browse a curated collection of properties available for ${type} across the island. Our listings include private villas, land plots and unique investment opportunities suitable for both long-term living and property investment. Use filters to explore properties by location, number of bedrooms, rental terms and amenities such as private pools, enclosed living areas or nature views. Whether you are searching for a quiet home in the hills of Ubud or a vibrant property near Bali's beaches, our listings provide a convenient starting point for your search.`;

  if (segment?.kind === "bedroom") {
    return `Looking for ${segment.value} bedroom ${subject} in ${loc}? This page lists all our ${segment.value}-bedroom properties available for ${type} in this area. Each listing includes photos, prices and key features. Use the filters to narrow your search by sub-area, amenities or rental terms. ${base}`;
  }
  if (segment?.kind === "payment") {
    const pay = segment.value === "yearly" ? "yearly" : "monthly";
    return `Browse ${subject} available for ${pay} payment in ${loc}. This selection includes properties that accept ${pay} rental terms. ${base}`;
  }
  if (segment?.kind === "amenity") {
    const amenityLabel = (segment.value as string).replace(/-/g, " ");
    return `Find ${subject} with ${amenityLabel} in ${loc}. This page shows properties that feature ${amenityLabel}. ${base}`;
  }
  if (segment?.kind === "subArea") {
    return `Discover ${subject} in ${subAreaNames[subArea!]}, ${loc}. This neighborhood offers a unique blend of local culture and modern convenience. ${base}`;
  }
  if (area) {
    return `${areaName(area)} is one of Bali's most sought-after areas. ${base}`;
  }
  if (type) {
    return seoTextByType[type] ?? base;
  }
  return base;
}
