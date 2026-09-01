import type { Property } from "@/types/property";
import { areas } from "@/types/areas";
import { subAreaNames } from "@/types/areas";
import { fixVillaNumberDisplay } from "./propertyUtils";

/** Sanitize for URL/filename: lowercase, replace spaces and non-alphanumeric with single dash */
function slugPart(s: string): string {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "property";
}

/**
 * SEO filename for a property image (e.g. villa-2beds-33-ubud-kemenuh-1).
 * Pattern: type[-beds]-number-mainarea[-subarea]-index
 */
export function getPropertyImageSlug(
  property: Pick<
    Property,
    "types" | "bedrooms" | "villaNumber" | "mainArea" | "subArea"
  >,
  imageIndex: number
): string {
  const types = property.types || ["rent"];
  const isLand = types.includes("land");
  const isBusiness = types.includes("business");
  const isHotel = types.includes("hotels");
  const objectType =
    isHotel ? "hotel" : isLand ? "land" : isBusiness ? "business" : "villa";
  const num = fixVillaNumberDisplay(property.villaNumber);
  const numberPart = slugPart(num || "0");
  const mainArea = (property.mainArea || "ubud").toLowerCase().replace(/\s+/g, "-");
  const subArea = property.subArea
    ? slugPart(subAreaNames[property.subArea] || property.subArea)
    : "";

  const parts: string[] = [objectType];
  if (objectType === "villa" && property.bedrooms != null) {
    parts.push(`${property.bedrooms}bed${property.bedrooms === 1 ? "" : "s"}`);
  }
  parts.push(numberPart, mainArea);
  if (subArea) parts.push(subArea);
  parts.push(String(imageIndex + 1));

  return parts.join("-");
}

/**
 * SEO alt text for a property image (e.g. "Villa 2 beds 33 in Ubud Kemenuh 1").
 * Spaces, capitalized, "in" before area.
 */
export function getPropertyImageAlt(
  property: Pick<
    Property,
    "types" | "bedrooms" | "villaNumber" | "mainArea" | "subArea"
  >,
  imageIndex: number
): string {
  const types = property.types || ["rent"];
  const isLand = types.includes("land");
  const isBusiness = types.includes("business");
  const isHotel = types.includes("hotels");
  const objectTypeLabel =
    isHotel ? "Retreat hotel" : isLand ? "Land" : isBusiness ? "Business" : "Villa";
  const num = fixVillaNumberDisplay(property.villaNumber) || "—";
  const mainAreaId = property.mainArea || "ubud";
  const areaName = areas[mainAreaId]?.nameEn || mainAreaId;
  const subAreaName = property.subArea
    ? subAreaNames[property.subArea] || property.subArea
    : "";

  const parts: string[] = [objectTypeLabel];
  if (!isLand && !isBusiness && !isHotel && property.bedrooms != null) {
    parts.push(
      property.bedrooms === 1 ? "1 bed" : `${property.bedrooms} beds`
    );
  }
  parts.push(num, "in", areaName);
  if (subAreaName) parts.push(subAreaName);
  parts.push(String(imageIndex + 1));

  return parts.join(" ");
}
