"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { GuideMapPoi } from "@/types/article";
import { loadStyleForMap, type MapTilerStyleVariant } from "@/lib/mapStyleResolve";

type AreaGuideMapProps = {
  boundaryUrl: string;
  title?: string;
  caption?: string;
  pois?: GuideMapPoi[];
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function bboxFromPolygonRing(ring: number[][]): maplibregl.LngLatBoundsLike {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const [lng, lat] of ring) {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

function poisToGeoJSON(pois: GuideMapPoi[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: pois.map((p) => ({
      type: "Feature",
      properties: {
        id: p.id,
        label: p.label,
        note: p.note ?? "",
        mapsUrl: p.mapsUrl ?? "",
      },
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
    })),
  };
}

export default function AreaGuideMap({
  boundaryUrl,
  title = "Area on the map",
  caption,
  pois = [],
}: AreaGuideMapProps) {
  const [styleMode, setStyleMode] = useState<"streets" | "satellite">("streets");
  const [loadError, setLoadError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim();
  const poiKey = pois.map((p) => p.id).join(",");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    const run = async () => {
      setLoadError(null);
      let boundary: GeoJSON.FeatureCollection;
      try {
        const res = await fetch(boundaryUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        boundary = (await res.json()) as GeoJSON.FeatureCollection;
      } catch {
        if (!cancelled) setLoadError("Could not load area boundary.");
        return;
      }

      const feature = boundary.features[0];
      const ring =
        feature?.geometry?.type === "Polygon"
          ? feature.geometry.coordinates[0]
          : null;
      if (!ring?.length) {
        if (!cancelled) setLoadError("Area boundary data is invalid.");
        return;
      }

      const variant: MapTilerStyleVariant =
        styleMode === "satellite" ? "satellite" : "streets";
      const style = await loadStyleForMap(mapTilerKey, variant);
      if (cancelled || containerRef.current !== container) return;

      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          /* ignore */
        }
        mapRef.current = null;
      }

      const map = new maplibregl.Map({
        container,
        style,
        bounds: bboxFromPolygonRing(ring),
        fitBoundsOptions: { padding: 36, maxZoom: 14 },
      });
      if (cancelled || containerRef.current !== container) {
        map.remove();
        return;
      }

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: "280px" });
      mapRef.current = map;

      map.on("load", () => {
        if (cancelled) return;

        map.addSource("area-boundary", { type: "geojson", data: boundary });
        map.addLayer({
          id: "area-boundary-fill",
          type: "fill",
          source: "area-boundary",
          paint: {
            "fill-color": "#059669",
            "fill-opacity": 0.18,
          },
        });
        map.addLayer({
          id: "area-boundary-line",
          type: "line",
          source: "area-boundary",
          paint: {
            "line-color": "#047857",
            "line-width": 2.5,
            "line-opacity": 0.95,
          },
        });

        if (pois.length > 0) {
          map.addSource("area-pois", {
            type: "geojson",
            data: poisToGeoJSON(pois),
          });
          map.addLayer({
            id: "area-pois-point",
            type: "circle",
            source: "area-pois",
            paint: {
              "circle-color": "#047857",
              "circle-radius": 8,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            },
          });

          map.on("click", "area-pois-point", (e) => {
            const f = e.features?.[0];
            if (!f?.properties) return;
            const props = f.properties as Record<string, string>;
            const mapsLink = props.mapsUrl
              ? `<a href="${escapeHtml(props.mapsUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:8px;color:#047857;font-weight:600;font-size:13px">Open in Maps</a>`
              : "";
            const note = props.note
              ? `<div style="color:#57534e;font-size:12px;margin-top:4px">${escapeHtml(props.note)}</div>`
              : "";
            const html = `<div style="font:14px/1.45 system-ui,sans-serif">
              <div style="font-weight:600">${escapeHtml(props.label)}</div>
              ${note}
              ${mapsLink}
            </div>`;
            popupRef.current!.setLngLat(e.lngLat).setHTML(html).addTo(map);
          });

          map.on("mouseenter", "area-pois-point", () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "area-pois-point", () => {
            map.getCanvas().style.cursor = "";
          });
        }
      });
    };

    void run();

    return () => {
      cancelled = true;
      try {
        popupRef.current?.remove();
      } catch {
        /* ignore */
      }
      popupRef.current = null;
      try {
        mapRef.current?.remove();
      } catch {
        /* ignore */
      }
      mapRef.current = null;
    };
  }, [boundaryUrl, styleMode, mapTilerKey, poiKey, pois]);

  if (loadError) {
    return (
      <div className="my-8 rounded-xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-600">
        {loadError}
      </div>
    );
  }

  return (
    <figure className="my-8 not-prose">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-stone-900">{title}</h2>
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
        <div ref={containerRef} className="h-[min(420px,60vh)] w-full min-h-[280px]" />
      </div>
      {caption ? (
        <p className="article-image-caption mt-2 text-right text-xs font-light leading-snug text-stone-500">
          {caption}
        </p>
      ) : null}
    </figure>
  );
}
