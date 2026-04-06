/**
 * Reference points for “distance to center” copy on listing maps (scooter / car ranges).
 * Ubud uses two anchors in PropertyLocationMap (north/south); not listed here.
 */
export type AreaDistanceRef = {
  lat: number;
  lng: number;
  /** Shown under the map, e.g. “to Icon Bali Shopping Mall”. */
  label: string;
};

/** Decimal degrees WGS84 */
export const AREA_DISTANCE_REFS: Record<string, AreaDistanceRef> = {
  sanur: {
    lat: -8.68670272,
    lng: 115.2628654,
    label: "Icon Bali Shopping Mall",
  },
  seminyak: {
    lat: -8.68681,
    lng: 115.15537,
    label: "Eat Street / Jalan Kayu Aya (central Seminyak)",
  },
  kerobokan: {
    lat: -8.67278,
    lng: 115.16667,
    label: "Jalan Raya Kerobokan (area center)",
  },
  canggu: {
    lat: -8.6512,
    lng: 115.1354,
    label: "Batu Bolong / central Canggu",
  },
  "tanah-lot": {
    lat: -8.6211,
    lng: 115.0864,
    label: "Tanah Lot temple area",
  },
};
