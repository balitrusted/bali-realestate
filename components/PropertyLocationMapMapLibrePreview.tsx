"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useState } from "react";

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

export default function PropertyLocationMapMapLibrePreview({ title, areaLabel, displayLocation }: Props) {
  const coords = parseLatLng(displayLocation);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [styleMode, setStyleMode] = useState<"streets" | "outdoor" | "satellite">("streets");
  const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim();

  useEffect(() => {
    if (!coords || !mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
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
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [coords, title, areaLabel, styleMode, mapTilerKey]);

  if (!coords) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-stone-500">
          MapLibre preview{mapTilerKey ? " (MapTiler styles)" : " (fallback OSM)"}
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
    </div>
  );
}
