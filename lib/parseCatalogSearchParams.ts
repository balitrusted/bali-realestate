import type { CatalogFilters, SegmentKind } from "@/lib/propertiesCatalog";
import type { MainArea, SubArea } from "@/types/property";

const AMENITY_SEGMENT_TO_FILTER: Record<string, keyof CatalogFilters> = {
  pool: "hasPool",
  "nature-view": "hasNatureView",
  bathtub: "hasBathtub",
  "closed-kitchen": "hasClosedKitchen",
  "enclosed-living": "hasEnclosedLiving",
  "pet-friendly": "hasPetFriendly",
  "car-park": "hasCarPark",
  desk: "hasDesk",
  garage: "hasGarage",
  "high-speed-wifi": "hasHighSpeedWifi",
  "washing-machine": "hasWashingMachine",
};

/** Merge path segment (Ubud sub-path) into filters so map/list links match the current catalog view. */
export function mergeSegmentIntoCatalogFilters(
  base: CatalogFilters,
  segment: { kind: SegmentKind; value: string | number }
): CatalogFilters {
  if (!segment.kind) return { ...base };
  const out: CatalogFilters = { ...base };
  switch (segment.kind) {
    case "subArea":
      out.subArea = [segment.value as SubArea];
      break;
    case "bedroom":
      out.bedrooms = [Number(segment.value)];
      break;
    case "payment":
      if (segment.value === "yearly") out.minDuration = 12;
      else if (segment.value === "monthly") out.minDuration = 1;
      break;
    case "amenity": {
      const k = AMENITY_SEGMENT_TO_FILTER[String(segment.value)];
      if (k) (out as Record<string, unknown>)[k as string] = true;
      break;
    }
  }
  return out;
}

/** Shared catalog URL → filters (same keys as PropertyFilters / properties hub). */
export function parseCatalogSearchParams(
  query: Record<string, string | string[] | undefined>
): CatalogFilters {
  const filters: CatalogFilters = {};
  if (query.type && typeof query.type === "string") {
    const t = query.type;
    if (t === "villas" || t === "rent" || t === "sale" || t === "land" || t === "business" || t === "hotels") {
      filters.type = t as CatalogFilters["type"];
    }
  }
  if (query.mainArea && typeof query.mainArea === "string") {
    filters.mainArea = query.mainArea as MainArea;
  }
  if (query.subArea) {
    filters.subArea = (Array.isArray(query.subArea) ? query.subArea : [query.subArea]).map(
      (s) => s as SubArea
    );
  }
  if (query.bedrooms) {
    filters.bedrooms = (Array.isArray(query.bedrooms) ? query.bedrooms : [query.bedrooms]).map(
      (b) => Number(b)
    );
  }
  if (query.minDuration) filters.minDuration = Number(query.minDuration);
  if (query.maxPrice) filters.maxPrice = Number(query.maxPrice);
  const truthy = (v: string | string[] | undefined) => v === "true";
  if (truthy(query.hasBathtub)) filters.hasBathtub = true;
  if (truthy(query.hasCarPark)) filters.hasCarPark = true;
  if (truthy(query.hasClosedKitchen)) filters.hasClosedKitchen = true;
  if (truthy(query.hasDesk)) filters.hasDesk = true;
  if (truthy(query.hasEnclosedLiving)) filters.hasEnclosedLiving = true;
  if (truthy(query.hasGarage)) filters.hasGarage = true;
  if (truthy(query.hasHighSpeedWifi)) filters.hasHighSpeedWifi = true;
  if (truthy(query.hasNatureView)) filters.hasNatureView = true;
  if (truthy(query.hasPetFriendly)) filters.hasPetFriendly = true;
  if (truthy(query.hasPool)) filters.hasPool = true;
  if (truthy(query.hasWashingMachine)) filters.hasWashingMachine = true;
  return filters;
}

/** Build `/properties/map?…` from the same `CatalogFilters` used for the listing. */
export function buildMapHrefFromFilters(filters: CatalogFilters): string {
  const q = new URLSearchParams();
  if (filters.type) q.set("type", filters.type);
  if (filters.mainArea) q.set("mainArea", String(filters.mainArea));
  if (filters.subArea?.length) q.set("subArea", filters.subArea.join(","));
  if (filters.bedrooms?.length) q.set("bedrooms", filters.bedrooms.join(","));
  if (filters.minDuration) q.set("minDuration", String(filters.minDuration));
  if (filters.maxPrice) q.set("maxPrice", String(filters.maxPrice));
  const flags: [keyof CatalogFilters, string][] = [
    ["hasBathtub", "hasBathtub"],
    ["hasCarPark", "hasCarPark"],
    ["hasClosedKitchen", "hasClosedKitchen"],
    ["hasDesk", "hasDesk"],
    ["hasEnclosedLiving", "hasEnclosedLiving"],
    ["hasGarage", "hasGarage"],
    ["hasHighSpeedWifi", "hasHighSpeedWifi"],
    ["hasNatureView", "hasNatureView"],
    ["hasPetFriendly", "hasPetFriendly"],
    ["hasPool", "hasPool"],
    ["hasWashingMachine", "hasWashingMachine"],
  ];
  for (const [k, param] of flags) {
    if (filters[k] === true) q.set(param, "true");
  }
  const s = q.toString();
  return s ? `/properties/map?${s}` : "/properties/map";
}

/** List/catalog URL matching current filters (path when type+area, else /properties + query). */
export function buildListHrefFromFilters(f: CatalogFilters): string {
  const q = new URLSearchParams();
  if (f.subArea?.length) q.set("subArea", f.subArea.join(","));
  if (f.bedrooms?.length) q.set("bedrooms", f.bedrooms.join(","));
  if (f.minDuration) q.set("minDuration", String(f.minDuration));
  if (f.maxPrice) q.set("maxPrice", String(f.maxPrice));
  const flagKeys: [keyof CatalogFilters, string][] = [
    ["hasBathtub", "hasBathtub"],
    ["hasCarPark", "hasCarPark"],
    ["hasClosedKitchen", "hasClosedKitchen"],
    ["hasDesk", "hasDesk"],
    ["hasEnclosedLiving", "hasEnclosedLiving"],
    ["hasGarage", "hasGarage"],
    ["hasHighSpeedWifi", "hasHighSpeedWifi"],
    ["hasNatureView", "hasNatureView"],
    ["hasPetFriendly", "hasPetFriendly"],
    ["hasPool", "hasPool"],
    ["hasWashingMachine", "hasWashingMachine"],
  ];
  for (const [k, param] of flagKeys) {
    if (f[k] === true) q.set(param, "true");
  }
  const qs = q.toString();

  if (f.type && f.mainArea) {
    return `/properties/${f.type}/${f.mainArea}${qs ? `?${qs}` : ""}`;
  }
  if (f.type) {
    return `/properties/${f.type}${qs ? `?${qs}` : ""}`;
  }
  if (f.mainArea) {
    const qq = new URLSearchParams(qs);
    qq.set("mainArea", String(f.mainArea));
    return `/properties?${qq.toString()}`;
  }
  return qs ? `/properties?${qs}` : "/properties";
}
