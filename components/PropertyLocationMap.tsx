"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type Props = {
  title: string;
  areaLabel: string;
  displayLocation?: string;
};

function parseLatLng(raw?: string): [number, number] | null {
  if (!raw) return null;
  const parts = raw.split(",").map((p) => Number(p.trim()));
  if (parts.length !== 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) return null;
  const [lat, lng] = parts;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

export default function PropertyLocationMap({ title, areaLabel, displayLocation }: Props) {
  const coords = parseLatLng(displayLocation);
  const [styleMode, setStyleMode] = useState<"streets" | "outdoor" | "satellite">("streets");
  const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!coords || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const [lat, lng] = coords;
    const mapTilerStyle =
      mapTilerKey && styleMode === "outdoor"
        ? `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${mapTilerKey}`
        : mapTilerKey && styleMode === "satellite"
          ? `https://api.maptiler.com/maps/hybrid/style.json?key=${mapTilerKey}`
          : mapTilerKey
            ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${mapTilerKey}`
            : null;
    const fallbackRasterStyle = {
      version: 8 as const,
      sources: {
        osm: {
          type: "raster" as const,
          tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: "&copy; OpenStreetMap contributors",
          maxzoom: 19,
        },
      },
      layers: [{ id: "osm-raster", type: "raster" as const, source: "osm" }],
    };

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapTilerStyle || fallbackRasterStyle,
      center: [lng, lat],
      zoom: 15,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const popup = new maplibregl.Popup({ offset: 18 }).setHTML(
      `<div style="font-size:12px"><strong>${title}</strong><br/>${areaLabel}</div>`
    );
    new maplibregl.Marker({ color: "#047857" }).setLngLat([lng, lat]).setPopup(popup).addTo(map);

    mapInstanceRef.current = map;
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [coords, title, areaLabel, styleMode, mapTilerKey]);

  if (!coords) {
    return (
      <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-600">
        <p className="font-medium text-stone-800">Location map will appear here.</p>
        <p className="mt-1">Coordinates are not added yet for this listing.</p>
      </div>
    );
  }
  const [lat, lng] = coords;
  const approxMapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-stone-500">
          {mapTilerKey ? "Map styles" : "Map style (fallback)"}
        </p>
        <div className="inline-flex rounded-full border border-stone-200 bg-white p-0.5">
          <button
            type="button"
            onClick={() => setStyleMode("streets")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              styleMode === "streets" ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            Streets
          </button>
          <button
            type="button"
            onClick={() => setStyleMode("outdoor")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              styleMode === "outdoor" ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            Outdoor
          </button>
          <button
            type="button"
            onClick={() => setStyleMode("satellite")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              styleMode === "satellite" ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            Satellite
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-stone-200">
        <div ref={mapContainerRef} className="h-64 w-full" />
      </div>
      <a
        href={approxMapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
      >
        Open area on map ↗
      </a>
    </div>
  );
}
