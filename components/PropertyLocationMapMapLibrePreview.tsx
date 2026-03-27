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
  const [styleMode, setStyleMode] = useState<"standard" | "enhanced">("enhanced");

  useEffect(() => {
    if (!coords || !mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const [lat, lng] = coords;
    const tilesUrl =
      styleMode === "enhanced"
        ? "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        : "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const attribution =
      styleMode === "enhanced"
        ? '&copy; OpenStreetMap contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        : "&copy; OpenStreetMap contributors";

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      // Raster style rendered by MapLibre (easy side-by-side visual comparison).
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: [tilesUrl],
            tileSize: 256,
            attribution,
            maxzoom: 19,
          },
        },
        layers: [
          {
            id: "osm-raster",
            type: "raster",
            source: "osm",
          },
        ],
      },
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
  }, [coords, title, areaLabel, styleMode]);

  if (!coords) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-stone-500">MapLibre preview</p>
        <div className="inline-flex rounded-full border border-stone-200 bg-white p-0.5">
          <button
            type="button"
            onClick={() => setStyleMode("standard")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              styleMode === "standard" ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            Standard
          </button>
          <button
            type="button"
            onClick={() => setStyleMode("enhanced")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              styleMode === "enhanced" ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            Enhanced
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-stone-200">
        <div ref={mapContainerRef} className="h-64 w-full" />
      </div>
    </div>
  );
}
