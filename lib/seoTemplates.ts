import { PropertyType, MainArea } from "@/types/property";
import { areas, subAreaNames } from "@/types/areas";
import { SubArea } from "@/types/property";

const typeLabels: Record<PropertyType, string> = {
  rent: "Rent",
  sale: "Buy",
  land: "Land",
  business: "Business",
};

const subjectByType: Record<PropertyType, string> = {
  rent: "Villas",
  sale: "Villas",
  land: "Land",
  business: "Business",
};

const areaName = (a: MainArea) => areas[a]?.nameEn ?? a;

export function buildTitle(
  type: PropertyType,
  area?: MainArea,
  subArea?: SubArea,
  segment?: { kind: string | null; value: string | number }
): string {
  const subject = subjectByType[type];
  const verb = typeLabels[type];
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
  type: PropertyType,
  area?: MainArea,
  subArea?: SubArea,
  segment?: { kind: string | null; value: string | number }
): string {
  const subject = subjectByType[type];
  const verb = typeLabels[type];
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
  type: PropertyType,
  area?: MainArea,
  subArea?: SubArea,
  segment?: { kind: string | null; value: string | number }
): string {
  const subject = subjectByType[type].toLowerCase();
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

export function buildSeoText(
  type: PropertyType,
  area?: MainArea,
  subArea?: SubArea,
  segment?: { kind: string | null; value: string | number }
): string {
  const subject = subjectByType[type].toLowerCase();
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
    return base;
  }
  return base;
}
