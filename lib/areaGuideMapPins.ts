import type { PropertyMapPin } from "@/components/PropertiesMapClient";
import {
  loadAllProperties,
  loadAllPropertiesForSlugIndex,
  filterProperties,
} from "@/lib/propertiesCatalog";
import { buildPropertySlugIndex } from "@/lib/propertySlug";
import { parseLatLng } from "@/lib/mapGeo";
import {
  mapAreaLine,
  mapPinShortLabel,
  mapPopupTitle,
  mapPriceLine,
} from "@/lib/mapListingFormat";
import type { SubArea } from "@/types/property";

/** Catalog pins for an Ubud sub-area guide map overlay. */
export async function loadAreaGuideMapPins(subArea: SubArea): Promise<PropertyMapPin[]> {
  const all = await loadAllProperties();
  const slugIdx = buildPropertySlugIndex(await loadAllPropertiesForSlugIndex());
  const filtered = filterProperties(all, {
    mainArea: "ubud",
    subArea: [subArea],
    type: "villas",
  });

  return filtered
    .map((p) => {
      const coords = parseLatLng(p.displayLocation);
      if (!coords) return null;
      const [lat, lng] = coords;
      return {
        id: String(p.id),
        lat,
        lng,
        shortLabel: mapPinShortLabel(p),
        popupTitle: mapPopupTitle(p),
        areaLine: mapAreaLine(p),
        priceLine: mapPriceLine(p),
        detailHref: slugIdx.pathFor(p),
      } satisfies PropertyMapPin;
    })
    .filter((p): p is PropertyMapPin => p != null);
}
