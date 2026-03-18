"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { PropertyType, MainArea } from "@/types/property";
import { areas } from "@/types/areas";

type Subject = "villas" | "land" | "business";
const VALID_TYPES: PropertyType[] = ["rent", "sale", "land", "business"];
const PATH_TYPE_SLUGS = ["rent", "sale", "land", "business", "villas"] as const;
const MAIN_AREAS: MainArea[] = ["ubud", "canggu", "sanur", "seminyak", "tanah-lot"];
const BEDROOMS = [1, 2, 3, 4] as const;
const AMENITY_OPTIONS: { key: string; label: string }[] = [
  { key: "hasPool", label: "Pool" },
  { key: "hasBathtub", label: "Bathtub" },
  { key: "hasClosedKitchen", label: "Closed kitchen" },
  { key: "hasEnclosedLiving", label: "Enclosed living" },
  { key: "hasNatureView", label: "Nature view" },
  { key: "hasCarPark", label: "Car park" },
  { key: "hasDesk", label: "Desk" },
  { key: "hasPetFriendly", label: "Pet friendly" },
];

function parsePath(pathname: string): { basePath: string; pathType: PropertyType | "villas" | null; pathArea: MainArea | null } {
  const parts = pathname.replace(/\/$/, "").split("/");
  if (parts[1] !== "properties") {
    return { basePath: "/properties", pathType: null, pathArea: null };
  }
  const pathType = parts[2] && PATH_TYPE_SLUGS.includes(parts[2] as (typeof PATH_TYPE_SLUGS)[number])
    ? (parts[2] as PropertyType | "villas")
    : null;
  const pathArea = parts[3] && MAIN_AREAS.includes(parts[3] as MainArea) ? (parts[3] as MainArea) : null;
  const basePath = pathType ? `/properties/${pathType}${pathArea ? `/${pathArea}` : ""}` : "/properties";
  return { basePath, pathType, pathArea };
}

type CatalogWizardProps = {
  /** If provided, show only these areas in the "Which area?" step. */
  availableMainAreas?: MainArea[];
};

export default function CatalogWizard({ availableMainAreas }: CatalogWizardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { basePath, pathType, pathArea } = useMemo(() => parsePath(pathname ?? ""), [pathname]);

  const subject = searchParams.get("subject") as Subject | null;
  const typeFromQuery = searchParams.get("type") as PropertyType | null;
  const both = pathType === "villas" || searchParams.get("both") === "1";
  const type = pathType ?? typeFromQuery;
  const mainArea = pathArea ?? (searchParams.get("mainArea") as MainArea | null);
  const areaDone = searchParams.get("areaDone") === "1";
  const bedroomsParam = searchParams.get("bedrooms");
  const bedrooms = bedroomsParam ? bedroomsParam.split(",").map(Number) : [];
  const bedroomsDone = searchParams.get("bedroomsDone") === "1";
  const minDuration = searchParams.get("minDuration") ? Number(searchParams.get("minDuration")) : undefined;
  const amenityKeys = AMENITY_OPTIONS.map((o) => o.key);
  const amenityParams = amenityKeys.filter((k) => searchParams.get(k) === "true");
  const amenitiesDone = searchParams.get("amenitiesDone") === "1";

  const isRootCatalog = pathname === "/properties" || pathname === "/properties/";

  const pushQuery = useCallback(
    (updates: Record<string, string | number | undefined | string[]>) => {
      const next = new URLSearchParams(searchParams.toString());
      if (pathType) next.delete("type");
      if (pathArea) next.delete("mainArea");
      Object.entries(updates).forEach(([k, v]) => {
        if (v === undefined || v === "") next.delete(k);
        else if (Array.isArray(v)) next.set(k, v.join(","));
        else next.set(k, String(v));
      });
      const q = next.toString();
      router.push(`${basePath}${q ? `?${q}` : ""}`, { scroll: false });
    },
    [router, searchParams, basePath, pathType, pathArea]
  );

  const setFilter = useCallback(
    (key: string, value: string | number | string[] | undefined) => {
      if (key === "mainArea" && pathType && !pathArea && value && typeof value === "string") {
        router.push(`${basePath}/${value}`, { scroll: false });
        return;
      }
      const next = new URLSearchParams(searchParams.toString());
      if (pathType) next.delete("type");
      if (pathArea) next.delete("mainArea");
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, Array.isArray(value) ? value.join(",") : String(value));
      const q = next.toString();
      router.push(`${basePath}${q ? `?${q}` : ""}`, { scroll: false });
    },
    [router, searchParams, basePath, pathType, pathArea]
  );

  // Step 0: What are you looking for? (only on root /properties)
  if (isRootCatalog && !subject && !type && !both) {
    return (
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 md:p-5 mb-6">
        <p className="text-sm font-medium text-gray-500 mb-2">Step 1 of 5</p>
        <p className="text-lg font-semibold text-gray-900 mb-4">What are you looking for?</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.push("/properties/villas", { scroll: false })}
            className="px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-800 font-medium hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
          >
            Villa
          </button>
          <button
            type="button"
            onClick={() => router.push("/properties/land", { scroll: false })}
            className="px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-800 font-medium hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
          >
            Land
          </button>
          <button
            type="button"
            onClick={() => router.push("/properties/business", { scroll: false })}
            className="px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-800 font-medium hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
          >
            Business
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Rent or Buy? (on /properties/villas)
  if (pathType === "villas" && !pathArea) {
    return (
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 md:p-5 mb-6">
        <p className="text-sm font-medium text-gray-500 mb-2">Step 2 of 5</p>
        <p className="text-lg font-semibold text-gray-900 mb-4">Rent or buy?</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.push("/properties/rent", { scroll: false })}
            className="px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-800 font-medium hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
          >
            Rent
          </button>
          <button
            type="button"
            onClick={() => router.push("/properties/sale", { scroll: false })}
            className="px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-800 font-medium hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => router.push("/properties/villas", { scroll: false })}
            className="px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-800 font-medium hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
          >
            Both
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Area (when we have type from path or query, no area in path yet)
  if (!pathArea && !mainArea && !areaDone && (type || both)) {
    const allowedAreas = Array.isArray(availableMainAreas) && availableMainAreas.length > 0
      ? new Set(availableMainAreas)
      : null;
    const areaOptions = allowedAreas ? MAIN_AREAS.filter((a) => allowedAreas.has(a)) : MAIN_AREAS;

    return (
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 md:p-5 mb-6">
        <p className="text-sm font-medium text-gray-500 mb-2">Step 3 of 5</p>
        <p className="text-lg font-semibold text-gray-900 mb-4">Which area?</p>
        <div className="flex flex-wrap gap-2">
          {areaOptions.map((areaId) => {
            const area = areas[areaId];
            return (
              <button
                key={areaId}
                type="button"
                onClick={() => setFilter("mainArea", areaId)}
                className="px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-800 font-medium hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
              >
                {area?.nameEn ?? areaId}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setFilter("areaDone", "1")}
            className="px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-300 bg-white text-gray-600 font-medium hover:border-gray-400 transition-colors"
          >
            All areas
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Bedrooms (only for villas: rent, sale, or both)
  const showBedrooms =
    (type === "rent" || type === "sale" || both) &&
    bedrooms.length === 0 &&
    !bedroomsDone &&
    (mainArea || areaDone);
  if (showBedrooms) {
    return (
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 md:p-5 mb-6">
        <p className="text-sm font-medium text-gray-500 mb-2">Step 4 of 5</p>
        <p className="text-lg font-semibold text-gray-900 mb-4">How many bedrooms?</p>
        <div className="flex flex-wrap gap-2">
          {BEDROOMS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setFilter("bedrooms", [String(b)])}
              className="px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-800 font-medium hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
            >
              {b} {b === 1 ? "bed" : "beds"}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFilter("bedroomsDone", "1")}
            className="px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-300 bg-white text-gray-600 font-medium hover:border-gray-400 transition-colors"
          >
            Any
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Amenities
  const pastBedrooms = bedrooms.length > 0 || bedroomsDone;
  const showAmenitiesStep =
    (type === "rent" || type === "sale" || both) &&
    (mainArea || areaDone) &&
    pastBedrooms &&
    amenityParams.length === 0 &&
    !amenitiesDone;
  if (showAmenitiesStep) {
    return (
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 md:p-5 mb-6">
        <p className="text-sm font-medium text-gray-500 mb-2">Step 5 of 5</p>
        <p className="text-lg font-semibold text-gray-900 mb-4">What matters to you? (optional)</p>
        <div className="flex flex-wrap gap-2">
          {AMENITY_OPTIONS.slice(0, 6).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key, "true")}
              className="px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-800 font-medium hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFilter("amenitiesDone", "1")}
            className="px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-300 bg-white text-gray-600 font-medium hover:border-gray-400 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  return null;
}
