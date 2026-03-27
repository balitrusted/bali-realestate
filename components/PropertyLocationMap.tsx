"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!coords || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: coords,
      zoom: 14,
      scrollWheelZoom: false,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const marker = L.circleMarker(coords, {
      radius: 8,
      color: "#065f46",
      fillColor: "#10b981",
      fillOpacity: 0.95,
      weight: 2,
    }).addTo(map);

    marker.bindPopup(`<div><strong>${title}</strong><br/>${areaLabel}</div>`);

    mapInstanceRef.current = map;
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [coords, title, areaLabel]);

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
