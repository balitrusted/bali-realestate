"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MainArea, SubArea } from "@/types/property";

type Props = {
  title: string;
  areaLabel: string;
  displayLocation?: string;
  mainArea: MainArea;
  subArea?: SubArea;
};

function parseLatLng(raw?: string): [number, number] | null {
  if (!raw) return null;
  const parts = raw.split(",").map((p) => Number(p.trim()));
  if (parts.length !== 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) return null;
  const [lat, lng] = parts;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toTimeRange(minutesBase: number): string {
  const min = Math.max(5, Math.round((minutesBase * 0.8) / 5) * 5);
  const max = Math.max(min + 3, Math.round((minutesBase * 1.2) / 5) * 5);
  return `${min}-${max} min`;
}

function getUbudEta(mainArea: MainArea, coords: [number, number] | null, subArea?: SubArea): string | null {
  if (mainArea !== "ubud") return null;
  if (!coords) return "Estimated to Ubud Center: by scooter 8-20 min · by car 10-25 min";

  const south = new Set<SubArea>(["lodtunduh", "kemenuh", "sayan", "sukawati"]);
  const north = new Set<SubArea>(["gentong", "petulu"]);
  // Internal anchors only for ETA math (not displayed to users).
  const centerSouth: [number, number] = [-8.5208, 115.2674];
  const centerNorth: [number, number] = [-8.5069, 115.2625];
  const anchor = subArea && south.has(subArea) ? centerSouth : subArea && north.has(subArea) ? centerNorth : centerNorth;
  const distKm = haversineKm(coords, anchor);
  // Approx city speeds + intersection/traffic overhead.
  const carBaseMin = distKm / 24 * 60 + 5;
  const scooterBaseMin = distKm / 30 * 60 + 4;
  const carRange = toTimeRange(carBaseMin);
  const scooterRange = toTimeRange(scooterBaseMin);

  return `Estimated to Ubud Center: by scooter ${scooterRange} · by car ${carRange}`;
}

export default function PropertyLocationMap({ title, areaLabel, displayLocation, mainArea, subArea }: Props) {
  const coords = parseLatLng(displayLocation);
  const [styleMode, setStyleMode] = useState<"streets" | "outdoor" | "satellite">("streets");
  const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const eta = getUbudEta(mainArea, coords, subArea);

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
      {eta ? <p className="text-xs text-stone-600">{eta}</p> : null}
    </div>
  );
}
