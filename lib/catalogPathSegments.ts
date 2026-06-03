import { isValidMainAreaSlug } from "@/lib/mainAreaRegistry";
import type { MainArea } from "@/types/property";

/** `/properties/rent/ubud/monthly` → area + deep segment; `/properties/rent/monthly` → type-level segment only. */
export function parsePropertiesPathSegments(pathname: string): {
  mainArea?: MainArea;
  typeLevelSegment?: string;
  deepSegment?: string;
} {
  const m = pathname.match(/^\/properties\/(?:villas|rent|sale|land|business)(?:\/([^/]+))?(?:\/([^/]+))?/);
  const first = m?.[1];
  const second = m?.[2];
  if (!first) return {};
  if (isValidMainAreaSlug(first)) {
    return { mainArea: first as MainArea, deepSegment: second };
  }
  return { typeLevelSegment: first, deepSegment: second };
}

/** Slug used for monthly/yearly/bedroom/amenity in path (type-level or under an area). */
export function catalogFilterSegmentSlug(pathname: string): string | undefined {
  const { mainArea, typeLevelSegment, deepSegment } = parsePropertiesPathSegments(pathname);
  return mainArea ? deepSegment : typeLevelSegment;
}
