"use client";

import { useEffect, useRef } from "react";
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

export default function PropertyLocationMapMapLibrePreview({ title, areaLabel, displayLocation }: Props) {
  const coords = parseLatLng(displayLocation);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!coords || !mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const [lat, lng] = coords;
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      // Demo vector style from MapLibre (great for visual PoC, switch in production)
      style: "https://demotiles.maplibre.org/style.json",
      center: [lng, lat],
      zoom: 13.5,
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
  }, [coords, title, areaLabel]);

  if (!coords) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-stone-500">MapLibre GL preview (vector tiles)</p>
      <div className="overflow-hidden rounded-xl border border-stone-200">
        <div ref={mapContainerRef} className="h-64 w-full" />
      </div>
    </div>
  );
}
