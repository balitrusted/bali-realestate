"use client";

import { useEffect, useRef } from "react";
import maplibregl, { type Map, type MapLayerMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { loadStyleForMap } from "@/lib/mapStyleResolve";

export type PropertyMapPin = {
  id: string;
  lat: number;
  lng: number;
  shortLabel: string;
  popupTitle: string;
  areaLine: string;
  priceLine: string;
  detailHref: string;
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pinsToGeoJSON(pins: PropertyMapPin[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: pins.map((p) => ({
      type: "Feature",
      properties: {
        id: p.id,
        shortLabel: p.shortLabel,
        popupTitle: p.popupTitle,
        areaLine: p.areaLine,
        priceLine: p.priceLine,
        detailHref: p.detailHref,
      },
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
    })),
  };
}

const BALI_CENTER: [number, number] = [115.216, -8.409];

export default function PropertiesMapClient({ pins }: { pins: PropertyMapPin[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim();
    const data = pinsToGeoJSON(pins);

    const run = async () => {
      const style = await loadStyleForMap(mapTilerKey, "streets");
      if (cancelled || containerRef.current !== container) return;

      const map = new maplibregl.Map({
        container,
        style,
        center: BALI_CENTER,
        zoom: pins.length > 0 ? 9 : 8.5,
      });
      if (cancelled || containerRef.current !== container) {
        map.remove();
        return;
      }
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      mapRef.current = map;
      popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: "300px" });

      map.on("load", () => {
        if (cancelled) return;

        map.addSource("listings", {
          type: "geojson",
          data,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 55,
        });

        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "listings",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#047857",
            "circle-radius": ["step", ["get", "point_count"], 18, 10, 22, 30, 28],
            "circle-opacity": 0.92,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff",
          },
        });

        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "listings",
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-font": ["Open Sans Bold"],
            "text-size": 13,
          },
          paint: {
            "text-color": "#ffffff",
          },
        });

        map.addLayer({
          id: "unclustered-point",
          type: "circle",
          source: "listings",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": "#059669",
            "circle-radius": 9,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff",
          },
        });

        if (pins.length > 0) {
          const b = new maplibregl.LngLatBounds([pins[0].lng, pins[0].lat], [pins[0].lng, pins[0].lat]);
          for (let i = 1; i < pins.length; i++) {
            b.extend([pins[i].lng, pins[i].lat]);
          }
          map.fitBounds(b, { padding: 72, maxZoom: 12, duration: 0 });
        }

        const zoomCluster = async (e: MapLayerMouseEvent) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ["clusters", "cluster-count"] });
          const clusterId = features[0]?.properties?.cluster_id as number | undefined;
          if (clusterId === undefined || !features[0]) return;
          const source = map.getSource("listings") as maplibregl.GeoJSONSource;
          try {
            const zoom = await source.getClusterExpansionZoom(clusterId);
            const geom = features[0].geometry as GeoJSON.Point;
            map.easeTo({ center: geom.coordinates as [number, number], zoom });
          } catch {
            /* ignore */
          }
        };

        map.on("click", "clusters", zoomCluster);
        map.on("click", "cluster-count", zoomCluster);

        map.on("click", "unclustered-point", (e: MapLayerMouseEvent) => {
          const f = e.features?.[0];
          if (!f?.properties) return;
          const props = f.properties as Record<string, string>;
          const html = `<div style="font:14px/1.45 system-ui,sans-serif">
          <div style="font-weight:600;margin-bottom:4px">${escapeHtml(props.popupTitle)}</div>
          <div style="color:#4b5563;font-size:12px;margin-bottom:4px">${escapeHtml(props.areaLine)}</div>
          <div style="font-weight:600;color:#047857;font-size:13px;margin-bottom:8px">${escapeHtml(props.priceLine)}</div>
          <a href="${escapeHtml(props.detailHref)}" style="display:inline-block;color:#047857;font-weight:600;font-size:13px">View listing →</a>
        </div>`;
          popupRef.current!.setLngLat(e.lngLat).setHTML(html).addTo(map);
        });

        map.on("mouseenter", "clusters", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "clusters", () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("mouseenter", "cluster-count", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "cluster-count", () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("mouseenter", "unclustered-point", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "unclustered-point", () => {
          map.getCanvas().style.cursor = "";
        });
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
  }, [pins]);

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 shadow-sm">
      <div ref={containerRef} className="h-[min(70vh,560px)] w-full min-h-[320px]" />
    </div>
  );
}
