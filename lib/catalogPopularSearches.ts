import { filterProperties, type SegmentKind } from "@/lib/propertiesCatalog";
import type { Property } from "@/types/property";

export type PopularSearchGroupId = "ubud-rent" | "bedrooms" | "features" | "neighborhoods";

export type PopularSearchDefinition = {
  label: string;
  href: string;
  group: PopularSearchGroupId;
  segment?: { kind: SegmentKind; value: string | number };
};

export const POPULAR_SEARCH_GROUP_LABELS: Record<PopularSearchGroupId, string> = {
  "ubud-rent": "Ubud long-term rent",
  bedrooms: "By bedroom count",
  features: "Popular features",
  neighborhoods: "Ubud neighborhoods",
};

/** Canonical SEO category links (groups A–D). */
export const POPULAR_SEARCH_DEFINITIONS: PopularSearchDefinition[] = [
  // A — Ubud rent hub
  { label: "Villas for rent in Ubud", href: "/properties/rent/ubud", group: "ubud-rent" },
  { label: "Monthly rent in Ubud", href: "/properties/rent/ubud/monthly", group: "ubud-rent", segment: { kind: "payment", value: "monthly" } },
  { label: "Yearly rent in Ubud", href: "/properties/rent/ubud/yearly", group: "ubud-rent", segment: { kind: "payment", value: "yearly" } },

  // B — Bedrooms
  { label: "1-bedroom villas in Ubud", href: "/properties/rent/ubud/1-bedroom-villa", group: "bedrooms", segment: { kind: "bedroom", value: 1 } },
  { label: "2-bedroom villas in Ubud", href: "/properties/rent/ubud/2-bedroom-villa", group: "bedrooms", segment: { kind: "bedroom", value: 2 } },
  { label: "3-bedroom villas in Ubud", href: "/properties/rent/ubud/3-bedroom-villa", group: "bedrooms", segment: { kind: "bedroom", value: 3 } },
  { label: "4-bedroom villas in Ubud", href: "/properties/rent/ubud/4-bedroom-villa", group: "bedrooms", segment: { kind: "bedroom", value: 4 } },

  // C — Amenities
  { label: "Ubud villas with pool", href: "/properties/rent/ubud/pool", group: "features", segment: { kind: "amenity", value: "pool" } },
  { label: "Villas with enclosed kitchen", href: "/properties/rent/ubud/closed-kitchen", group: "features", segment: { kind: "amenity", value: "closed-kitchen" } },
  { label: "Enclosed living in Ubud", href: "/properties/rent/ubud/enclosed-living", group: "features", segment: { kind: "amenity", value: "enclosed-living" } },
  { label: "Nature view in Ubud", href: "/properties/rent/ubud/nature-view", group: "features", segment: { kind: "amenity", value: "nature-view" } },
  { label: "Villas with car park", href: "/properties/rent/ubud/car-park", group: "features", segment: { kind: "amenity", value: "car-park" } },
  { label: "Villas with washing machine", href: "/properties/rent/ubud/washing-machine", group: "features", segment: { kind: "amenity", value: "washing-machine" } },

  // D — Sub-areas
  { label: "Penestanan", href: "/properties/rent/ubud/penestanan", group: "neighborhoods", segment: { kind: "subArea", value: "penestanan" } },
  { label: "Lodtunduh", href: "/properties/rent/ubud/lodtunduh", group: "neighborhoods", segment: { kind: "subArea", value: "lodtunduh" } },
  { label: "Sayan", href: "/properties/rent/ubud/sayan", group: "neighborhoods", segment: { kind: "subArea", value: "sayan" } },
  { label: "Gentong", href: "/properties/rent/ubud/gentong", group: "neighborhoods", segment: { kind: "subArea", value: "gentong" } },
  { label: "Mas", href: "/properties/rent/ubud/mas", group: "neighborhoods", segment: { kind: "subArea", value: "mas" } },
  { label: "Petulu", href: "/properties/rent/ubud/petulu", group: "neighborhoods", segment: { kind: "subArea", value: "petulu" } },
];

export type ResolvedPopularSearchLink = Pick<PopularSearchDefinition, "label" | "href">;

export type ResolvedPopularSearchGroup = {
  id: PopularSearchGroupId;
  label: string;
  links: ResolvedPopularSearchLink[];
};

function definitionHasActiveListings(properties: Property[], def: PopularSearchDefinition): boolean {
  const list = filterProperties(properties, { type: "rent", mainArea: "ubud" }, def.segment);
  return list.some((p) => !p.archived);
}

/** Groups with links that have ≥1 active listing. */
export function resolvePopularSearches(properties: Property[]): ResolvedPopularSearchGroup[] {
  const order: PopularSearchGroupId[] = ["ubud-rent", "bedrooms", "features", "neighborhoods"];
  const byGroup = new Map<PopularSearchGroupId, ResolvedPopularSearchLink[]>();

  for (const def of POPULAR_SEARCH_DEFINITIONS) {
    if (!definitionHasActiveListings(properties, def)) continue;
    const links = byGroup.get(def.group) ?? [];
    links.push({ label: def.label, href: def.href });
    byGroup.set(def.group, links);
  }

  return order
    .filter((id) => (byGroup.get(id)?.length ?? 0) > 0)
    .map((id) => ({
      id,
      label: POPULAR_SEARCH_GROUP_LABELS[id],
      links: byGroup.get(id)!,
    }));
}
