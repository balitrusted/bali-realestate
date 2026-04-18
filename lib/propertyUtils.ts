import { Property } from "@/types/property";
import { subAreaNames } from "@/types/areas";

/** Land-only listing (not combined with rent/sale/business on the same card). */
export function isPureLandListing(property: Pick<Property, "types">): boolean {
  const t = property.types ?? [];
  return t.includes("land") && !t.includes("rent") && !t.includes("sale") && !t.includes("business");
}

/** Replacement character (U+FFFD) appears when CSV was read with wrong encoding. */
const REPLACEMENT_CHAR = "\uFFFD";

/**
 * Fix text that contains replacement characters from encoding errors.
 * - At line start (after newline): was list bullet → •
 * - Between letters (e.g. Children's): was apostrophe → '
 * Use for display and in admin form so data can be saved corrected.
 */
export function fixDescriptionDisplay(text: string | undefined): string {
  if (!text) return "";
  let s = text;
  // Bullet at line start (after ^ or \n, optional spaces/tabs only)
  s = s.replace(new RegExp(`(^|\\n)([ \t]*)${REPLACEMENT_CHAR}(?=\\s|$)`, "gm"), "$1$2•");
  // Apostrophe between letters (e.g. Children's, it's)
  s = s.replace(new RegExp(`(\\w)${REPLACEMENT_CHAR}(\\w)`, "g"), "$1'$2");
  // Any remaining (e.g. trailing or before punctuation) → apostrophe
  s = s.replace(new RegExp(REPLACEMENT_CHAR, "g"), "'");
  return s;
}

/**
 * Fix villa number display (e.g. "27" → "27A" when the letter was corrupted by encoding).
 */
export function fixVillaNumberDisplay(text: string | undefined): string {
  if (!text) return "";
  return text.replace(new RegExp(REPLACEMENT_CHAR, "g"), "A");
}

/** Normalize villa number for uniqueness checks (trim, encoding fix, case-insensitive). */
export function normalizeVillaNumberKey(v: string | undefined): string {
  const s = (v ?? "").trim();
  if (!s) return "";
  return fixVillaNumberDisplay(s).toLowerCase();
}

/**
 * Display title for a property. If title is set — use it. Otherwise build short line from params.
 * Examples: "Villa #50 · 2 bed · Lodtunduh", "Land #34 · Lodtunduh", or "2-bed villa · Lodtunduh".
 */
export function getPropertyDisplayTitle(property: Property): string {
  const t = property.title?.trim();
  if (t) return t;

  const beds = property.bedrooms ?? 0;
  const bedLabel = beds === 1 ? "1 bed" : `${beds} bed`;
  const areaName = property.subArea ? (subAreaNames[property.subArea] || property.subArea) : "";

  if (property.villaNumber?.trim?.()) {
    const num = fixVillaNumberDisplay(property.villaNumber).trim().replace(/^#/, "");
    if (isPureLandListing(property)) {
      return areaName ? `Land #${num} · ${areaName}` : `Land #${num}`;
    }
    return areaName ? `Villa #${num} · ${bedLabel} · ${areaName}` : `Villa #${num} · ${bedLabel}`;
  }
  return areaName ? `${bedLabel} villa · ${areaName}` : `${bedLabel} villa`;
}
