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
    if (area) return `Villas for Rent and Sale in ${areaName(area)} | Balitrusted`;
    return "Villas for Rent and Sale in Bali | Balitrusted";
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
  if (type) {
    return `${subject} for ${verb} in Bali | Balitrusted`;
  }
  return "Bali Properties for Rent and Sale | Villas, Land and Investments - Balitrusted";
}

export function buildH1(
  type: CatalogTypeForSeo,
  area?: MainArea,
  subArea?: SubArea,
  segment?: { kind: string | null; value: string | number }
): string {
  if (type === "villas" && !segment) {
    if (area) return `Villas for Rent and Sale in ${areaName(area)}`;
    return "Villas for Rent and Sale in Bali";
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
  if (type) {
    return `${subject} for ${verb} in Bali`;
  }
  return "Bali Properties for Rent and Sale";
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
    return "Browse villas for rent and sale in Bali. Find long-term rentals and villas for purchase across Ubud, Canggu, Sanur and more.";
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
  if (type) {
    return `Browse ${subject} in Bali. Find properties across Ubud, Canggu, Sanur and more.`;
  }
  return "Explore a curated selection of Bali properties including villas for rent, land plots, and investment opportunities. Discover homes across Ubud, Canggu, Seminyak and other Bali locations.";
}

/** Unique SEO texts for level-1 type-only pages (e.g. /properties/rent, /properties/sale, /properties/villas). */
const seoTextByType: Record<string, string> = {
  rent: `Looking for a villa to rent in Bali? This page lists private villas available for long-term rental across the island — from Ubud and the central highlands to coastal areas like Canggu, Seminyak and Sanur. All listings are verified and suitable for stays of one month or more. You can filter by area, number of bedrooms, payment terms (monthly or yearly) and amenities such as private pool, enclosed kitchen, bathtub or nature view. Whether you need a one-bedroom for remote work or a family villa with several bedrooms, our catalog helps you find a rental that fits your budget and lifestyle.`,
  sale: `Interested in buying a villa or house in Bali? Here you can browse villas for sale across the island. Our listings include freehold and leasehold options in popular areas like Ubud, Canggu, Seminyak and Tanah Lot. Use the filters to narrow by location, size and features. Buying property in Bali involves specific legal and permit requirements; we recommend consulting our guides and specialists before making a decision.`,
  villas: `Looking for a villa in Bali — to rent or to buy? This page lists all villas available for both long-term rental and purchase across the island. You can choose to rent monthly or yearly, or explore options for buying. Filter by area (Ubud, Canggu, Sanur, Seminyak, Tanah Lot), number of bedrooms and amenities such as pool, bathtub or enclosed kitchen. Whether you plan to rent for a few months or invest in a property, our catalog helps you find the right villa.`,
  land: `Searching for land for sale in Bali? This page shows land plots available for purchase in different areas of the island. Land listings may be suitable for building a villa, developing a small project or long-term investment. Locations range from the green hills of Ubud to coastal zones. Always verify zoning, permits and ownership structure with a qualified professional before committing.`,
  business: `Exploring business property or commercial opportunities in Bali? This section lists properties that can be used for business — guesthouses, small hotels, cafes or other ventures. Listings may include villas with tourist accommodation permits or land suitable for commercial use. Check each listing and local regulations to ensure the property fits your business plan.`,
};

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
