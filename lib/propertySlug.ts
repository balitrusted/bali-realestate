import type { Property } from "@/types/property";

/** URL segment only (no leading slash, no /properties prefix). */
export type PropertySlugSegment = string;

function isVillaLike(p: Property): boolean {
  return p.types.some((t) => t === "rent" || t === "sale");
}

function kindPrefix(p: Property): "villa" | "land" | "business" {
  const v = isVillaLike(p);
  if (p.types.includes("land") && !v) return "land";
  if (p.types.includes("business") && !v) return "business";
  return "villa";
}

/**
 * ASCII slug fragment: lowercase, hyphens, safe for URL path.
 */
export function slugifyPart(raw: string): string {
  const s = raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "x";
}

function refToken(p: Property): string {
  const n = p.villaNumber?.trim();
  if (n) return slugifyPart(n);
  return slugifyPart(p.id.replace(/^prop-/, ""));
}

/**
 * Base slug before collision suffix (-2, -3, …).
 */
export function buildPropertySlugBase(p: Property): PropertySlugSegment {
  const area = slugifyPart(p.mainArea);
  const prefix = kindPrefix(p);
  if (prefix === "villa") {
    const n = Math.max(0, Math.floor(p.bedrooms));
    return `villa-${refToken(p)}-${n}bed-${area}`;
  }
  if (prefix === "land") {
    return `land-${refToken(p)}-${area}`;
  }
  return `business-${refToken(p)}-${area}`;
}

/**
 * Stable unique slug per property id. Collisions: second gets `-2`, third `-3`, …
 */
export function assignPropertySlugs(properties: Property[]): Map<string, PropertySlugSegment> {
  const sorted = [...properties].sort((a, b) => a.id.localeCompare(b.id));
  const idToSlug = new Map<string, PropertySlugSegment>();
  const countByBase = new Map<string, number>();

  for (const p of sorted) {
    const base = buildPropertySlugBase(p);
    const c = countByBase.get(base) ?? 0;
    countByBase.set(base, c + 1);
    let slug: PropertySlugSegment;
    if (c === 0) {
      slug = base;
    } else {
      slug = `${base}-${c + 1}`;
    }
    idToSlug.set(p.id, slug);
  }

  return idToSlug;
}

export function buildPropertySlugIndex(properties: Property[]) {
  const idToSlug = assignPropertySlugs(properties);
  const slugToProperty = new Map<string, Property>();

  for (const p of properties) {
    const s = idToSlug.get(p.id);
    if (s) slugToProperty.set(s.toLowerCase(), p);
  }

  return {
    /** `/properties/{segment}` */
    pathFor(p: Property): string {
      const s = idToSlug.get(p.id);
      if (!s) return "/properties";
      return `/properties/${s}`;
    },
    segmentFor(p: Property): PropertySlugSegment {
      return idToSlug.get(p.id) ?? slugifyPart(p.id);
    },
    bySlugSegment(segment: string): Property | null {
      return slugToProperty.get(segment.trim().toLowerCase()) ?? null;
    },
  };
}

export function getCanonicalPropertyPath(p: Property, all: Property[]): string {
  return buildPropertySlugIndex(all).pathFor(p);
}
