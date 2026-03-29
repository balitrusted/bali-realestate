/** Admin + catalog: confirmed yes / confirmed no / not yet known from owner */
export type FeatureTriState = "yes" | "no" | "unknown";

export const PROPERTY_FEATURE_KEYS = [
  "bathtub",
  "carPark",
  "closedKitchen",
  "desk",
  "enclosedLivingArea",
  "garage",
  "highSpeedWifi",
  "natureView",
  "petFriendly",
  "pool",
  "washingMachine",
] as const;

export type PropertyFeatureKey = (typeof PROPERTY_FEATURE_KEYS)[number];

export function normalizeFeatureValue(v: unknown): FeatureTriState {
  if (v === true || v === "yes") return "yes";
  if (v === "no") return "no";
  /** Legacy booleans: only `true` meant “yes”; `false` was often “not filled” → treat as unknown */
  if (v === false) return "unknown";
  if (v === "unknown" || v === "no_info") return "unknown";
  return "unknown";
}

/** Catalog filters and public “has X” — only explicit yes counts */
export function featureIsYes(v: unknown): boolean {
  return v === true || v === "yes";
}

export function normalizePropertyFeatures(
  features: Partial<Record<PropertyFeatureKey, unknown>> | undefined
): Record<PropertyFeatureKey, FeatureTriState> {
  const f = features || {};
  return Object.fromEntries(
    PROPERTY_FEATURE_KEYS.map((k) => [k, normalizeFeatureValue(f[k])])
  ) as Record<PropertyFeatureKey, FeatureTriState>;
}

/**
 * Admin property list (`/admin/properties`): drive the small amber “Amenities” badge on each row
 * when any feature is still “unknown” (owner not confirmed yet), so the team can scan the list without
 * opening every listing. Not used on the public site.
 */
export function propertyHasUnknownAmenities(
  features: Partial<Record<PropertyFeatureKey, unknown>> | undefined
): boolean {
  if (!features) return true;
  return PROPERTY_FEATURE_KEYS.some((k) => normalizeFeatureValue(features[k]) === "unknown");
}
