import type { StyleSpecification } from "maplibre-gl";

/** OSM raster fallback; inline object avoids MapLibre `loadURL` races with React Strict Mode. */
export const OSM_RASTER_STYLE: StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  projection: { type: "mercator" },
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [{ id: "osm-raster", type: "raster", source: "osm" }],
};

export type MapTilerStyleVariant = "streets" | "outdoor" | "satellite";

/**
 * Resolve style synchronously-ish for Map ctor: fetch remote JSON first, then pass an object.
 * Passing a string URL makes MapLibre use loadURL(); abrupt unmount can leave a stray async
 * completion that throws (this.style undefined in migrateProjection).
 */
export async function loadStyleForMap(
  mapTilerKey: string | undefined,
  variant: MapTilerStyleVariant
): Promise<StyleSpecification> {
  const key = mapTilerKey?.trim();
  if (!key) return OSM_RASTER_STYLE;
  const path =
    variant === "outdoor" ? "outdoor-v2" : variant === "satellite" ? "hybrid" : "streets-v2";
  const url = `https://api.maptiler.com/maps/${path}/style.json?key=${encodeURIComponent(key)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return OSM_RASTER_STYLE;
    return (await res.json()) as StyleSpecification;
  } catch {
    return OSM_RASTER_STYLE;
  }
}
