import catalogStructure from "@/data/catalog-structure.json";
import { areas, type AreaInfo } from "@/types/areas";
import type { MainArea } from "@/types/property";

const BUILTIN_SLUGS = new Set(Object.keys(areas) as MainArea[]);

/** Merged main-area slugs: built-in `areas` + extra rows from `data/catalog-structure.json`. */
export function isValidMainAreaSlug(slug: string): boolean {
  if (!slug || typeof slug !== "string") return false;
  if (BUILTIN_SLUGS.has(slug as MainArea)) return true;
  return catalogStructure.areas.some((a) => a.slug === slug);
}

/** Display name for filters, cards, and SEO fallbacks. */
export function resolveAreaLabel(slug: string): string {
  const built = areas[slug as keyof typeof areas];
  if (built) return built.nameEn;
  const row = catalogStructure.areas.find((a) => a.slug === slug);
  return row?.nameEn ?? slug;
}

/** Short SEO blurb when area exists only in catalog JSON (no full `areas` entry). */
export function resolveAreaSeoDescription(slug: string): string {
  const built = areas[slug as keyof typeof areas];
  if (built?.seoDescription) return built.seoDescription;
  if (built?.description) return built.description;
  const name = resolveAreaLabel(slug);
  return `Browse properties in ${name}. Verified listings with clear filters.`;
}

/** Admin + filter dropdowns: built-in areas plus any catalog-only slugs. */
export function getMergedAreaInfos(): AreaInfo[] {
  const list: AreaInfo[] = Object.values(areas);
  const seen = new Set(list.map((a) => a.id));
  for (const row of catalogStructure.areas) {
    if (!seen.has(row.slug)) {
      seen.add(row.slug);
      list.push({
        id: row.slug as MainArea,
        name: row.nameEn,
        nameEn: row.nameEn,
        description: `${row.nameEn} — listings on Balitrusted.`,
        seoTitle: `${row.nameEn} — properties for rent and sale`,
        seoDescription: `Find properties in ${row.nameEn}.`,
      });
    }
  }
  return list.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
}

/** Slugs in stable order for wizard / path parsing (all known areas). */
export function getAllMainAreaSlugs(): string[] {
  return getMergedAreaInfos().map((a) => a.id);
}
