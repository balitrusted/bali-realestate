import type { Property } from "@/types/property";
import { getPropertyDisplayTitle, isPureLandListing } from "@/lib/propertyUtils";
import { areas, subAreaNames } from "@/types/areas";

/** Short line for map pin (Villa #n · X beds, or Land #n). */
export function mapPinShortLabel(property: Property): string {
  if (isPureLandListing(property) && property.villaNumber?.trim()) {
    const n = property.villaNumber.trim().replace(/^#/, "");
    return `Land #${n}`;
  }
  const beds = property.bedrooms ?? 0;
  const bedWord = beds === 1 ? "bed" : "beds";
  if (property.villaNumber?.trim()) {
    const n = property.villaNumber.trim().replace(/^#/, "");
    return `Villa #${n} · ${beds} ${bedWord}`;
  }
  return `${beds} ${bedWord}`;
}

/** One-line area for popup. */
export function mapAreaLine(property: Property): string {
  const main = property.mainArea ? areas[property.mainArea as keyof typeof areas]?.nameEn || property.mainArea : "";
  const sub = property.subArea != null ? subAreaNames[property.subArea] || property.subArea : "";
  return [main, sub].filter(Boolean).join(" · ");
}

/** Plain-text price for map popup (no currency conversion). */
export function mapPriceLine(property: Property): string {
  const p = property.price;
  const fmt = (n: number) =>
    p.currency === "IDR" ? `${Math.round(n / 1_000_000)}M IDR` : `$${n.toLocaleString()}`;
  if (property.types?.includes("sale") && p.forSale != null && p.forSale > 0) {
    return `${fmt(p.forSale)} · for sale`;
  }
  const monthly = p.monthly;
  const yearly = p.yearly;
  const hasYearlyOnly = (yearly != null && yearly > 0) && (monthly == null || monthly === 0);
  if (hasYearlyOnly && yearly != null) return `${fmt(yearly)} / year`;
  if (monthly != null && monthly > 0) return `${fmt(monthly)} / month`;
  if (yearly != null && yearly > 0) return `${fmt(yearly)} / year`;
  if (p.min != null && p.min > 0) return fmt(p.min);
  return "Price on request";
}

export function mapPopupTitle(property: Property): string {
  return getPropertyDisplayTitle(property);
}
