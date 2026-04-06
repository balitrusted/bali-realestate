/**
 * Bedroom options for catalog URLs, filters, and admin forms.
 * Keep this file free of Node/fs imports so client components can import it safely.
 */
export const BEDROOM_SEGMENT_SLUGS = [
  "1-bedroom-villa",
  "2-bedroom-villa",
  "3-bedroom-villa",
  "4-bedroom-villa",
  "5-bedroom-villa",
  "6-bedroom-villa",
  "7-bedroom-villa",
  "8-bedroom-villa",
] as const;

/** Same order as BEDROOM_SEGMENT_SLUGS (derived so slugs stay the single source). */
export const ALLOWED_BEDROOM_COUNTS: readonly number[] =
  BEDROOM_SEGMENT_SLUGS.map((slug) => parseInt(slug.split("-")[0], 10));
