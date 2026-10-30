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

const OSM_DARK_RASTER_STYLE: StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  projection: { type: "mercator" },
  sources: {
    carto: {
      type: "raster",
      tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
      maxzoom: 19,
    },
  },
  layers: [{ id: "carto-dark", type: "raster", source: "carto" }],
};

export type MapTilerStyleVariant = "streets" | "outdoor" | "satellite" | "dark";

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
  const fallbackStyle = variant === "dark" ? OSM_DARK_RASTER_STYLE : OSM_RASTER_STYLE;
  if (!key) return fallbackStyle;
  const path =
    variant === "outdoor"
      ? "outdoor-v2"
      : variant === "satellite"
        ? "hybrid"
        : variant === "dark"
          ? "darkmatter"
          : "streets-v2";
  const url = `https://api.maptiler.com/maps/${path}/style.json?key=${encodeURIComponent(key)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return fallbackStyle;
    return (await res.json()) as StyleSpecification;
  } catch {
    return fallbackStyle;
  }
}
