"use client";

import { useMemo, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { MainArea, PropertyType } from "@/types/property";
import { areas, subAreaNames } from "@/types/areas";

const MAIN_AREAS: MainArea[] = ["ubud", "canggu", "sanur", "seminyak", "tanah-lot"];
const PATH_TYPE_SLUGS = ["rent", "sale", "land", "business", "hotels", "villas"] as const;
type PathType = PropertyType | "villas" | null;

function parsePath(pathname: string): { pathType: PathType; pathArea: MainArea | null } {
  const parts = pathname.replace(/\/$/, "").split("/");
  if (parts[1] !== "properties") return { pathType: null, pathArea: null };
  const pathType =
    parts[2] && PATH_TYPE_SLUGS.includes(parts[2] as (typeof PATH_TYPE_SLUGS)[number])
      ? (parts[2] as PropertyType | "villas")
      : null;
  const pathArea = parts[3] && MAIN_AREAS.includes(parts[3] as MainArea) ? (parts[3] as MainArea) : null;
  return { pathType, pathArea };
}

const TYPE_LABEL: Record<Exclude<PathType, null>, string> = {
  villas: "villas",
  rent: "rent",
  sale: "for sale",
  land: "land",
  business: "business",
  hotels: "retreat hotels",
};

const AMENITY_FILTERS: { key: string; label: string }[] = [
  { key: "hasPool", label: "pool" },
  { key: "hasBathtub", label: "bathtub" },
  { key: "hasClosedKitchen", label: "enclosed kitchen" },
  { key: "hasEnclosedLiving", label: "enclosed living" },
  { key: "hasNatureView", label: "nature view" },
  { key: "hasCarPark", label: "car park" },
  { key: "hasDesk", label: "desk" },
  { key: "hasPetFriendly", label: "pet friendly" },
  { key: "hasGarage", label: "garage" },
  { key: "hasHighSpeedWifi", label: "high-speed WiFi" },
  { key: "hasWashingMachine", label: "washing machine" },
];

type Chip = {
  id: string;
  label: string;
  onRemove: () => void;
};

export default function ActiveFiltersBar() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();

  const { pathType, pathArea } = useMemo(() => parsePath(pathname), [pathname]);

  const removeQueryKeys = useCallback(
    (keys: string[]) => {
      const next = new URLSearchParams(searchParams.toString());
      keys.forEach((k) => next.delete(k));
      const q = next.toString();
      router.push(`${pathname}${q ? `?${q}` : ""}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const openFilters = useCallback(() => {
    const btn = document.querySelector<HTMLButtonElement>("[data-catalog-filters-toggle]");
    btn?.click();
  }, []);

  const chips: Chip[] = useMemo(() => {
    const out: Chip[] = [];

    const typeFromQueryLegacy = searchParams.get("type") as PropertyType | null;
    const isVillasBaseEffective =
      pathType === "villas" || pathType === "rent" || pathType === "sale" || searchParams.get("both") === "1" || typeFromQueryLegacy === "rent" || typeFromQueryLegacy === "sale";

    // Type chip (path-based)
    if (pathType) {
      // "Foundation" (villas/land/business) is not a parameter -> don't show it as an active chip.
      // Only rent/sale are considered a parameter within villas.
      const isParameterType = pathType === "rent" || pathType === "sale";
      if (isParameterType) {
        out.push({
          id: `type:${pathType}`,
          label: TYPE_LABEL[pathType],
          onRemove: () => {
            const next = new URLSearchParams(searchParams.toString());
            next.delete("type");
            next.delete("both");
            next.delete("areaDone");
            next.delete("bedroomsDone");
            next.delete("amenitiesDone");
            next.delete("minDuration");
            const q = next.toString();
            router.push(`/properties/villas${q ? `?${q}` : ""}`, { scroll: false });
          },
        });
      }
    } else {
      // Root query type (legacy)
      const typeFromQuery = searchParams.get("type") as PropertyType | null;
      if (typeFromQuery) {
        // Same rule as path-based: land/business/villas are foundation -> hide.
        if (typeFromQuery === "rent" || typeFromQuery === "sale") {
          out.push({
            id: `typeq:${typeFromQuery}`,
            label: TYPE_LABEL[typeFromQuery],
            onRemove: () => removeQueryKeys(["type", "areaDone", "bedroomsDone", "amenitiesDone", "minDuration"]),
          });
        }
      }
      if (searchParams.get("both") === "1") {
        // "both=1" represents villas foundation (legacy) -> hide it as a chip.
      }
    }

    // Area chip (path or query)
    if (pathArea && pathType) {
      out.push({
        id: `area:${pathArea}`,
        label: areas[pathArea]?.nameEn ?? pathArea,
        onRemove: () => {
          const next = new URLSearchParams(searchParams.toString());
          next.delete("mainArea");
          next.delete("subArea");
          next.delete("areaDone");
          const q = next.toString();
          router.push(`/properties/${pathType}${q ? `?${q}` : ""}`, { scroll: false });
        },
      });
    } else {
      const mainArea = searchParams.get("mainArea") as MainArea | null;
      if (mainArea) {
        out.push({
          id: `areaq:${mainArea}`,
          label: areas[mainArea]?.nameEn ?? mainArea,
          onRemove: () => removeQueryKeys(["mainArea", "subArea", "areaDone"]),
        });
      }
    }

    // Sub-area(s)
    const subAreaRaw = searchParams.get("subArea");
    if (subAreaRaw) {
      const vals = subAreaRaw.split(",").filter(Boolean);
      vals.forEach((v) => {
        out.push({
          id: `subArea:${v}`,
          label: subAreaNames[v as keyof typeof subAreaNames] ?? v,
          onRemove: () => {
            const nextVals = vals.filter((x) => x !== v);
            const next = new URLSearchParams(searchParams.toString());
            if (nextVals.length) next.set("subArea", nextVals.join(","));
            else next.delete("subArea");
            const q = next.toString();
            router.push(`${pathname}${q ? `?${q}` : ""}`, { scroll: false });
          },
        });
      });
    }

    // Bedrooms
    if (isVillasBaseEffective) {
      const bedroomsRaw = searchParams.get("bedrooms");
      if (bedroomsRaw) {
        const vals = bedroomsRaw.split(",").filter(Boolean);
        vals.forEach((v) => {
          out.push({
            id: `bedrooms:${v}`,
            label: `${v} ${v === "1" ? "bed" : "beds"}`,
            onRemove: () => {
              const nextVals = vals.filter((x) => x !== v);
              const next = new URLSearchParams(searchParams.toString());
              if (nextVals.length) next.set("bedrooms", nextVals.join(","));
              else next.delete("bedrooms");
              next.delete("bedroomsDone");
              next.delete("amenitiesDone");
              const q = next.toString();
              router.push(`${pathname}${q ? `?${q}` : ""}`, { scroll: false });
            },
          });
        });
      }
    }

    // Payment (minDuration)
    if (isVillasBaseEffective) {
      const minDuration = searchParams.get("minDuration");
      if (minDuration) {
        const label = minDuration === "12" ? "yearly" : minDuration === "1" ? "monthly" : `${minDuration} months`;
        out.push({
          id: `minDuration:${minDuration}`,
          label,
          onRemove: () => removeQueryKeys(["minDuration"]),
        });
      }
    }

    // Max price
    if (isVillasBaseEffective) {
      if (searchParams.get("maxPrice")) {
        out.push({
          id: "maxPrice",
          label: "max price",
          onRemove: () => removeQueryKeys(["maxPrice"]),
        });
      }
    }

    // Amenities booleans
    if (isVillasBaseEffective) {
      AMENITY_FILTERS.forEach(({ key, label }) => {
        if (searchParams.get(key) === "true") {
          out.push({
            id: key,
            label,
            onRemove: () => removeQueryKeys([key, "amenitiesDone"]),
          });
        }
      });
    }

    // Done markers (only show if no other chips)
    if (out.length === 0) return out;

    return out;
  }, [pathType, pathArea, pathname, router, searchParams, removeQueryKeys]);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={openFilters}
        className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
      >
        All filters
      </button>
      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-800"
        >
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              chip.onRemove();
            }}
            className="text-gray-400 hover:text-gray-700"
            aria-label={`Remove ${chip.label}`}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

