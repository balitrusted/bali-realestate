import { Property, PropertyType, MainArea, SubArea } from "@/types/property";
import { featureIsYes } from "@/lib/featureState";
import { loadFullPropertyList } from "@/lib/propertiesStorage";
import { areas, subAreaNames } from "@/types/areas";
import { BEDROOM_SEGMENT_SLUGS } from "@/lib/catalogBedrooms";

const PER_PAGE = 25;

export { ALLOWED_BEDROOM_COUNTS } from "@/lib/catalogBedrooms";

export const SEGMENT_TYPES = {
  subArea: ["gentong", "kedewatan", "keliki", "kemenuh", "lodtunduh", "mas", "penestanan", "petulu", "sayan", "sukawati", "tegallalang"] as SubArea[],
  bedroom: BEDROOM_SEGMENT_SLUGS,
  payment: ["monthly", "yearly"] as const,
  amenity: [
    "pool",
    "nature-view",
    "bathtub",
    "closed-kitchen",
    "enclosed-living",
    "pet-friendly",
    "car-park",
    "desk",
    "garage",
    "high-speed-wifi",
    "washing-machine",
  ] as const,
} as const;

const amenityToFeature: Record<string, keyof Property["features"]> = {
  pool: "pool",
  "nature-view": "natureView",
  bathtub: "bathtub",
  "closed-kitchen": "closedKitchen",
  "enclosed-living": "enclosedLivingArea",
  "pet-friendly": "petFriendly",
  "car-park": "carPark",
  desk: "desk",
  garage: "garage",
  "high-speed-wifi": "highSpeedWifi",
  "washing-machine": "washingMachine",
};

export type SegmentKind = "subArea" | "bedroom" | "payment" | "amenity" | null;

export function parseSegment(segment: string, mainArea: MainArea, propertyType: PropertyType | "villas"): { kind: SegmentKind; value: string | number } | null {
  if (SEGMENT_TYPES.subArea.includes(segment as SubArea) && mainArea === "ubud") {
    return { kind: "subArea", value: segment };
  }
  if (SEGMENT_TYPES.bedroom.includes(segment as (typeof SEGMENT_TYPES.bedroom)[number])) {
    const m = segment.match(/^(\d+)-bedroom-villa$/);
    const num = m ? parseInt(m[1], 10) : parseInt(segment.charAt(0), 10);
    return { kind: "bedroom", value: num };
  }
  if (SEGMENT_TYPES.payment.includes(segment as (typeof SEGMENT_TYPES.payment)[number]) && (propertyType === "rent" || propertyType === "villas")) {
    return { kind: "payment", value: segment };
  }
  if (SEGMENT_TYPES.amenity.includes(segment as (typeof SEGMENT_TYPES.amenity)[number])) {
    return { kind: "amenity", value: segment };
  }
  return null;
}

/** URL slug for catalog level 1: rent, sale, land, business, or villas (rent + sale). */
export type CatalogTypeSlug = PropertyType | "villas";

export interface CatalogFilters {
  /** PropertyType or "villas" (show both rent and sale). */
  type?: PropertyType | "villas";
  mainArea?: MainArea;
  subArea?: SubArea[];
  bedrooms?: number[];
  hasBathtub?: boolean;
  hasCarPark?: boolean;
  hasClosedKitchen?: boolean;
  hasDesk?: boolean;
  hasEnclosedLiving?: boolean;
  hasGarage?: boolean;
  hasHighSpeedWifi?: boolean;
  hasNatureView?: boolean;
  hasPetFriendly?: boolean;
  hasPool?: boolean;
  hasWashingMachine?: boolean;
  /** Payment flavor for rent: 12 = listings with yearly rent price; 1 = listings with monthly rent price. */
  minDuration?: number;
  maxPrice?: number;
}

function hasValidPrice(p: Property): boolean {
  return !!(
    p?.price &&
    (typeof p.price.min === "number" ||
      typeof p.price.monthly === "number" ||
      typeof p.price.yearly === "number" ||
      typeof p.price.forSale === "number")
  );
}

function propertyHasYearlyRentPrice(p: Property): boolean {
  return (
    !!p.types?.includes("rent") && typeof p.price?.yearly === "number" && p.price.yearly > 0
  );
}

function propertyHasMonthlyRentPrice(p: Property): boolean {
  return (
    !!p.types?.includes("rent") && typeof p.price?.monthly === "number" && p.price.monthly > 0
  );
}

export async function loadAllProperties(): Promise<Property[]> {
  try {
    const properties = await loadFullPropertyList();
    return properties.filter((p) => {
      return p && p.id && hasValidPrice(p) && !p.archived;
    });
  } catch (error) {
    console.error("Error loading properties:", error);
    return [];
  }
}

/**
 * Valid-price listings including archived. Used for stable SEO slugs, redirects, and `/properties/p/[slug]`.
 */
export async function loadAllPropertiesForSlugIndex(): Promise<Property[]> {
  try {
    const properties = await loadFullPropertyList();
    return properties.filter((p) => p && p.id && hasValidPrice(p));
  } catch (error) {
    console.error("Error loading properties for slug index:", error);
    return [];
  }
}

export function filterProperties(
  properties: Property[],
  filters: CatalogFilters,
  segment?: { kind: SegmentKind; value: string | number }
): Property[] {
  let result = [...properties];

  if (filters.type) {
    if (filters.type === "villas") {
      result = result.filter((p) => p.types?.includes("rent") || p.types?.includes("sale"));
    } else {
      result = result.filter((p) => p.types?.includes(filters.type as PropertyType));
    }
  }
  if (filters.mainArea) {
    result = result.filter((p) => p.mainArea === filters.mainArea);
  }
  if (filters.subArea && filters.subArea.length > 0) {
    result = result.filter((p) => p.subArea != null && filters.subArea!.includes(p.subArea));
  }
  if (filters.bedrooms && filters.bedrooms.length > 0) {
    result = result.filter((p) => filters.bedrooms!.includes(p.bedrooms));
  }
  if (filters.minDuration === 12) {
    result = result.filter((p) => propertyHasYearlyRentPrice(p));
  } else if (filters.minDuration === 1) {
    result = result.filter((p) => propertyHasMonthlyRentPrice(p));
  }
  if (filters.maxPrice) {
    result = result.filter((p) => {
      const price = p.price?.monthly ?? p.price?.yearly ?? p.price?.forSale ?? p.price?.min ?? 0;
      return price > 0 && price <= filters.maxPrice!;
    });
  }

  // Segment overrides
  if (segment) {
    if (segment.kind === "subArea") {
      result = result.filter((p) => p.subArea === segment.value);
    } else if (segment.kind === "bedroom") {
      result = result.filter((p) => p.bedrooms === segment.value);
    } else if (segment.kind === "payment") {
      if (segment.value === "yearly") {
        result = result.filter((p) => propertyHasYearlyRentPrice(p));
      } else {
        result = result.filter((p) => propertyHasMonthlyRentPrice(p));
      }
    } else if (segment.kind === "amenity") {
      const feat = amenityToFeature[segment.value as string];
      if (feat) result = result.filter((p) => featureIsYes(p.features[feat]));
    }
  }

  // Query param feature filters (in addition to segment)
  if (filters.hasBathtub) result = result.filter((p) => featureIsYes(p.features.bathtub));
  if (filters.hasCarPark) result = result.filter((p) => featureIsYes(p.features.carPark));
  if (filters.hasClosedKitchen) result = result.filter((p) => featureIsYes(p.features.closedKitchen));
  if (filters.hasDesk) result = result.filter((p) => featureIsYes(p.features.desk));
  if (filters.hasEnclosedLiving) result = result.filter((p) => featureIsYes(p.features.enclosedLivingArea));
  if (filters.hasGarage) result = result.filter((p) => featureIsYes(p.features.garage));
  if (filters.hasHighSpeedWifi) result = result.filter((p) => featureIsYes(p.features.highSpeedWifi));
  if (filters.hasNatureView) result = result.filter((p) => featureIsYes(p.features.natureView));
  if (filters.hasPetFriendly) result = result.filter((p) => featureIsYes(p.features.petFriendly));
  if (filters.hasPool) result = result.filter((p) => featureIsYes(p.features.pool));
  if (filters.hasWashingMachine) result = result.filter((p) => featureIsYes(p.features.washingMachine));

  return result.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

const AMENITY_FILTER_KEYS: (keyof CatalogFilters)[] = [
  "hasBathtub",
  "hasCarPark",
  "hasClosedKitchen",
  "hasDesk",
  "hasEnclosedLiving",
  "hasGarage",
  "hasHighSpeedWifi",
  "hasNatureView",
  "hasPetFriendly",
  "hasPool",
  "hasWashingMachine",
];

/** Build filters used to decide which *main areas* appear (drops mainArea from the active filter set). */
export function catalogFiltersWithoutMainArea(f: CatalogFilters): CatalogFilters {
  const c = { ...f };
  delete c.mainArea;
  return c;
}

export function catalogFiltersWithoutSubArea(f: CatalogFilters): CatalogFilters {
  const c = { ...f };
  delete c.subArea;
  return c;
}

export function catalogFiltersWithoutBedrooms(f: CatalogFilters): CatalogFilters {
  const c = { ...f };
  delete c.bedrooms;
  return c;
}

export function catalogFiltersWithoutAmenities(f: CatalogFilters): CatalogFilters {
  const c = { ...f };
  for (const k of AMENITY_FILTER_KEYS) delete c[k];
  return c;
}

const DEFAULT_FEATURE_KEY_TO_PROP: Record<string, keyof Property["features"]> = {
  hasBathtub: "bathtub",
  hasCarPark: "carPark",
  hasClosedKitchen: "closedKitchen",
  hasDesk: "desk",
  hasEnclosedLiving: "enclosedLivingArea",
  hasGarage: "garage",
  hasHighSpeedWifi: "highSpeedWifi",
  hasNatureView: "natureView",
  hasPetFriendly: "petFriendly",
  hasPool: "pool",
  hasWashingMachine: "washingMachine",
};

/** Main areas that have ≥1 listing after applying the rest of the filters (and optional path segment). */
export function getAvailableMainAreas(
  properties: Property[],
  filtersSansMainArea: CatalogFilters,
  segment?: { kind: SegmentKind; value: string | number } | null
): MainArea[] {
  const list = filterProperties(properties, filtersSansMainArea, segment ?? undefined);
  const s = new Set<MainArea>();
  for (const p of list) {
    if (p.mainArea) s.add(p.mainArea);
  }
  return Array.from(s).sort((a, b) =>
    (areas[a]?.nameEn ?? a).localeCompare(areas[b]?.nameEn ?? b)
  );
}

/** Sub-areas that appear on ≥1 listing for this type + main area (ignores sub-area query). */
export function getAvailableSubAreas(
  properties: Property[],
  filtersSansSubArea: CatalogFilters,
  segment?: { kind: SegmentKind; value: string | number } | null
): SubArea[] {
  const list = filterProperties(properties, filtersSansSubArea, segment ?? undefined);
  const s = new Set<SubArea>();
  for (const p of list) {
    if (p.subArea != null) s.add(p.subArea);
  }
  return Array.from(s).sort((a, b) => subAreaNames[a].localeCompare(subAreaNames[b]));
}

/** Bedroom counts that exist on ≥1 listing (ignores bedrooms query). */
export function getAvailableBedroomCounts(
  properties: Property[],
  filtersSansBedrooms: CatalogFilters,
  segment?: { kind: SegmentKind; value: string | number } | null
): number[] {
  const list = filterProperties(properties, filtersSansBedrooms, segment ?? undefined);
  const s = new Set<number>();
  for (const p of list) {
    if (typeof p.bedrooms === "number" && p.bedrooms > 0) s.add(p.bedrooms);
  }
  return Array.from(s).sort((a, b) => a - b);
}

/** Amenity toggles that match ≥1 listing (ignores amenity query flags). */
export function getAvailableAmenityFilterKeys(
  properties: Property[],
  filtersSansAmenities: CatalogFilters,
  segment?: { kind: SegmentKind; value: string | number } | null,
  featureKeyToProp: Record<string, keyof Property["features"]> = DEFAULT_FEATURE_KEY_TO_PROP
): string[] {
  const list = filterProperties(properties, filtersSansAmenities, segment ?? undefined);
  return (Object.keys(featureKeyToProp) as string[]).filter((key) =>
    list.some((p) => featureIsYes(p.features[featureKeyToProp[key]]))
  );
}

export function paginate<T>(items: T[], page: number): { items: T[]; total: number; totalPages: number; page: number } {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const p = Math.max(1, Math.min(page, totalPages));
  const start = (p - 1) * PER_PAGE;
  const itemsPage = items.slice(start, start + PER_PAGE);
  return { items: itemsPage, total, totalPages, page: p };
}

export { PER_PAGE };
export { areas };
