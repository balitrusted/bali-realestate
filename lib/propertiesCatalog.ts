import { readFile } from "fs/promises";
import { join } from "path";
import { parsePropertiesFile } from "@/lib/parseProperties";
import { Property, PropertyType, MainArea, SubArea } from "@/types/property";
import { areas } from "@/types/areas";

const PER_PAGE = 25;

export const SEGMENT_TYPES = {
  subArea: ["gentong", "kedewatan", "keliki", "kemenuh", "lodtunduh", "penestanan", "petulu", "sayan", "sukawati", "tegallalang"] as SubArea[],
  bedroom: ["1-bedroom-villa", "2-bedroom-villa", "3-bedroom-villa", "4-bedroom-villa"] as const,
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
    const num = parseInt(segment.charAt(0), 10);
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
  minDuration?: number; // 12 = yearly
  maxPrice?: number;
}

export async function loadAllProperties(): Promise<Property[]> {
  try {
    const filePath = join(process.cwd(), "data", "properties.ts");
    const fileContent = await readFile(filePath, "utf-8");
    const properties = parsePropertiesFile(fileContent);
    return properties.filter((p) => {
      const hasPrice =
        p?.price &&
        (typeof p.price.min === "number" ||
          typeof p.price.monthly === "number" ||
          typeof p.price.yearly === "number" ||
          typeof p.price.forSale === "number");
      return p && p.id && hasPrice && !p.archived;
    });
  } catch (error) {
    console.error("Error loading properties:", error);
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
    result = result.filter((p) => (p.duration?.min ?? 1) >= 12);
  } else if (filters.minDuration === 1) {
    result = result.filter((p) => (p.duration?.min ?? 12) < 12);
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
        result = result.filter((p) => (p.duration?.min ?? 1) >= 12);
      } else {
        result = result.filter((p) => (p.duration?.min ?? 12) < 12);
      }
    } else if (segment.kind === "amenity") {
      const feat = amenityToFeature[segment.value as string];
      if (feat) result = result.filter((p) => p.features[feat] === true);
    }
  }

  // Query param feature filters (in addition to segment)
  if (filters.hasBathtub) result = result.filter((p) => p.features.bathtub);
  if (filters.hasCarPark) result = result.filter((p) => p.features.carPark);
  if (filters.hasClosedKitchen) result = result.filter((p) => p.features.closedKitchen);
  if (filters.hasDesk) result = result.filter((p) => p.features.desk);
  if (filters.hasEnclosedLiving) result = result.filter((p) => p.features.enclosedLivingArea);
  if (filters.hasGarage) result = result.filter((p) => p.features.garage);
  if (filters.hasHighSpeedWifi) result = result.filter((p) => p.features.highSpeedWifi);
  if (filters.hasNatureView) result = result.filter((p) => p.features.natureView);
  if (filters.hasPetFriendly) result = result.filter((p) => p.features.petFriendly);
  if (filters.hasPool) result = result.filter((p) => p.features.pool);
  if (filters.hasWashingMachine) result = result.filter((p) => p.features.washingMachine);

  return result.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
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
