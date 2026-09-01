import { areas, isSubAreaOfMainArea, subAreaNames } from "@/types/areas";
import type { Property } from "@/types/property";

export type PropertyCatalogDealType = "rent" | "sale" | "land" | "business" | "hotels";

/** Catalog type slug used for area / sub-area browse links on a listing. */
export function propertyCatalogDealType(property: Property): PropertyCatalogDealType {
  const types = property.types ?? [];
  if (types.includes("hotels")) return "hotels";
  if (types.includes("land")) return "land";
  if (types.includes("business")) return "business";
  if (types.includes("sale") && !types.includes("rent")) return "sale";
  if (types.includes("rent")) return "rent";
  if (types.includes("sale")) return "sale";
  return "rent";
}

export function mainAreaCatalogHref(property: Property): string | null {
  if (!property.mainArea) return null;
  const type = propertyCatalogDealType(property);
  return `/properties/${type}/${property.mainArea}`;
}

export function subAreaCatalogHref(property: Property): string | null {
  if (!property.mainArea || property.subArea == null) return null;
  if (!isSubAreaOfMainArea(property.mainArea, property.subArea)) return null;
  const type = propertyCatalogDealType(property);
  return `/properties/${type}/${property.mainArea}/${property.subArea}`;
}

/** CTA on villa detail: browse more listings in the same Ubud sub-area. */
export function subAreaBrowseLinkLabel(property: Property): string | null {
  if (!property.subArea || property.mainArea !== "ubud") return null;
  const label = subAreaNames[property.subArea];
  const deal = propertyCatalogDealType(property);
  if (deal === "sale") return `All villas for sale in ${label}`;
  if (deal === "land") return `All land in ${label}`;
  if (deal === "business") return `All business in ${label}`;
  if (deal === "hotels") return `All retreat venues in ${label}`;
  return `All villas in ${label}`;
}

export function mainAreaCatalogLabel(property: Property): string | null {
  if (!property.mainArea) return null;
  return areas[property.mainArea]?.nameEn ?? property.mainArea;
}
