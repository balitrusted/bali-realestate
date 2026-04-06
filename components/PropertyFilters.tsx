"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PropertyType, MainArea, SubArea } from "@/types/property";
import { areas, subAreaNames } from "@/types/areas";
import { ALLOWED_BEDROOM_COUNTS } from "@/lib/catalogBedrooms";
import ToggleSwitch from "@/components/ToggleSwitch";

const FILTERS_SESSION_KEY = "balitrusted-property-filters-open";

const FILTER_QUERY_KEYS = [
  "mainArea",
  "subArea",
  "bedrooms",
  "hasBathtub",
  "hasCarPark",
  "hasClosedKitchen",
  "hasDesk",
  "hasEnclosedLiving",
  "hasGarage",
  "hasHighSpeedWifi",
  "hasNatureView",
  "hasPetFriendly",
  "hasPool",
  "hasWashingMachine",
  "minDuration",
  "maxPrice",
  "type",
] as const;

type PropertyFiltersState = {
  mainArea?: MainArea;
  subArea: SubArea[];
  bedrooms: number[];
  type?: PropertyType;
  hasBathtub: boolean;
  hasCarPark: boolean;
  hasClosedKitchen: boolean;
  hasDesk: boolean;
  hasEnclosedLiving: boolean;
  hasGarage: boolean;
  hasHighSpeedWifi: boolean;
  hasNatureView: boolean;
  hasPetFriendly: boolean;
  hasPool: boolean;
  hasWashingMachine: boolean;
  minDuration?: number;
  maxPrice?: number;
};

function buildFiltersFromSearchParams(
  searchParams: ReturnType<typeof useSearchParams>,
  defaultMainArea?: MainArea,
  defaultType?: PropertyType,
  pathSubArea?: SubArea
): PropertyFiltersState {
  return {
    mainArea: defaultMainArea || (searchParams.get("mainArea") as MainArea) || undefined,
    subArea: (() => {
      const subAreaParam = searchParams.get("subArea");
      const fromQuery = subAreaParam
        ? subAreaParam
            .split(",")
            .map((v) => v.trim())
            .filter((v): v is SubArea => v in subAreaNames)
        : ([] as SubArea[]);
      if (fromQuery.length > 0) return fromQuery;
      if (pathSubArea) return [pathSubArea];
      return [] as SubArea[];
    })(),
    bedrooms: searchParams.get("bedrooms")
      ? searchParams
          .get("bedrooms")!
          .split(",")
          .map((v) => Number(v))
          .filter((n) => (ALLOWED_BEDROOM_COUNTS as readonly number[]).includes(n))
      : ([] as number[]),
    type: defaultType || (searchParams.get("type") as PropertyType) || undefined,
    hasBathtub: searchParams.get("hasBathtub") === "true",
    hasCarPark: searchParams.get("hasCarPark") === "true",
    hasClosedKitchen: searchParams.get("hasClosedKitchen") === "true",
    hasDesk: searchParams.get("hasDesk") === "true",
    hasEnclosedLiving: searchParams.get("hasEnclosedLiving") === "true",
    hasGarage: searchParams.get("hasGarage") === "true",
    hasHighSpeedWifi: searchParams.get("hasHighSpeedWifi") === "true",
    hasNatureView: searchParams.get("hasNatureView") === "true",
    hasPetFriendly: searchParams.get("hasPetFriendly") === "true",
    hasPool: searchParams.get("hasPool") === "true",
    hasWashingMachine: searchParams.get("hasWashingMachine") === "true",
    minDuration: searchParams.get("minDuration") ? Number(searchParams.get("minDuration")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
  };
}

interface PropertyFiltersProps {
  defaultType?: PropertyType;
  defaultMainArea?: MainArea;
  /**
   * If set, only these main areas appear (plus “any”). From server: areas with ≥1 listing for current scope.
   * If omitted, all configured areas are listed (legacy).
   */
  allowedMainAreas?: MainArea[];
  /** Sub-area pills: only these (plus “any”). Omit to fall back to static list for the selected main area. */
  allowedSubAreas?: SubArea[];
  /** Bedroom pills: only these counts (plus “any”). Omit = show 1–4. */
  allowedBedroomCounts?: number[];
  /** Amenity toggles that match ≥1 listing. Empty array = hide amenities block. Omit = show all keys from visibleFeatureOptions. */
  availableAmenityKeys?: string[];
  /** Limits visible filter blocks to the current "base" catalog category. */
  baseVariant?: "villas" | "land" | "business";
  /** Total properties matching current URL filters (from server). */
  matchingCount: number;
  /**
   * When the URL path encodes a single Ubud sub-area (e.g. /properties/villas/ubud/gentong),
   * pass it so filter chips stay in sync without ?subArea=.
   */
  pathSubArea?: SubArea;
}

export default function PropertyFilters({
  defaultType,
  defaultMainArea,
  allowedMainAreas,
  allowedSubAreas,
  allowedBedroomCounts,
  availableAmenityKeys,
  baseVariant,
  matchingCount,
  pathSubArea,
}: PropertyFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [filters, setFilters] = useState<PropertyFiltersState>(() =>
    buildFiltersFromSearchParams(searchParams, defaultMainArea, defaultType, pathSubArea)
  );

  // Keep filter state in sync with the URL (back/forward, Clear filters, navigation).
  useEffect(() => {
    setFilters(buildFiltersFromSearchParams(searchParams, defaultMainArea, defaultType, pathSubArea));
  }, [searchKey, searchParams, defaultMainArea, defaultType, pathSubArea]);

  // Restore open panel after navigation (e.g. area pill) so filters stay expanded.
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && sessionStorage.getItem(FILTERS_SESSION_KEY) === "1") {
        setIsCollapsed(false);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const openFilters = useCallback(() => {
    setIsCollapsed(false);
    try {
      sessionStorage.setItem(FILTERS_SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const closeFilters = useCallback(() => {
    setIsCollapsed(true);
    try {
      sessionStorage.removeItem(FILTERS_SESSION_KEY);
    } catch {
      /* ignore */
    }
    const el = document.getElementById("catalog-breadcrumb-anchor");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToListings = useCallback(() => {
    document.getElementById("catalog-listings-anchor")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const clearFilters = useCallback(() => {
    const mUbud = pathname.match(/^\/properties\/(villas|rent|sale|land|business)\/ubud\/([^/]+)$/);
    if (mUbud && areas.ubud.subAreas?.includes(mUbud[2] as SubArea)) {
      router.push(`/properties/${mUbud[1]}/ubud`, { scroll: false });
      return;
    }
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  const activeFilterParamsCount = useMemo(() => {
    let c = 0;
    for (const k of FILTER_QUERY_KEYS) {
      if (searchParams.get(k)) c += 1;
    }
    return c;
  }, [searchKey, searchParams]);

  const constrainedBase = baseVariant != null;
  const isVillasBase = baseVariant === "villas";
  const showVillasSpecificBlocks = !constrainedBase || isVillasBase;
  const showSubjectBlock = !constrainedBase;

  const staticSubAreasForMain: SubArea[] =
    filters.mainArea && areas[filters.mainArea]?.subAreas ? areas[filters.mainArea].subAreas || [] : [];
  const subAreaOptions: SubArea[] =
    allowedSubAreas !== undefined ? allowedSubAreas : staticSubAreasForMain;
  const areaList = Object.values(areas);
  const areasToShow =
    allowedMainAreas !== undefined
      ? areaList.filter((a) => allowedMainAreas.includes(a.id))
      : areaList;

  const updateURL = (newFilters: PropertyFiltersState) => {
    const currentPath = window.location.pathname;
    const matchSegment = currentPath.match(/\/properties\/([^/]+)\/([^/]+)(?:\/([^/]+))?/);
    const matchTypeOnly = currentPath.match(/^\/properties\/(rent|sale|land|business|villas)$/);
    const isTypeOnlyPath = !!matchTypeOnly;
    const pathType = matchSegment?.[1] ?? matchTypeOnly?.[1];
    const pathArea = matchSegment?.[2];

    const queryParams = new URLSearchParams();
    if (newFilters.mainArea) queryParams.set("mainArea", newFilters.mainArea);
    if (newFilters.subArea.length > 0) queryParams.set("subArea", newFilters.subArea.join(","));
    if (newFilters.bedrooms.length > 0) queryParams.set("bedrooms", newFilters.bedrooms.join(","));
    if (newFilters.hasBathtub) queryParams.set("hasBathtub", "true");
    if (newFilters.hasCarPark) queryParams.set("hasCarPark", "true");
    if (newFilters.hasClosedKitchen) queryParams.set("hasClosedKitchen", "true");
    if (newFilters.hasDesk) queryParams.set("hasDesk", "true");
    if (newFilters.hasEnclosedLiving) queryParams.set("hasEnclosedLiving", "true");
    if (newFilters.hasGarage) queryParams.set("hasGarage", "true");
    if (newFilters.hasHighSpeedWifi) queryParams.set("hasHighSpeedWifi", "true");
    if (newFilters.hasNatureView) queryParams.set("hasNatureView", "true");
    if (newFilters.hasPetFriendly) queryParams.set("hasPetFriendly", "true");
    if (newFilters.hasPool) queryParams.set("hasPool", "true");
    if (newFilters.hasWashingMachine) queryParams.set("hasWashingMachine", "true");
    if (newFilters.minDuration) queryParams.set("minDuration", newFilters.minDuration.toString());
    if (newFilters.maxPrice) queryParams.set("maxPrice", newFilters.maxPrice.toString());

    /** Drop redundant ?mainArea= when area is already in /properties/{type}/{area}/… */
    const qsForPath = (pathname: string, omitSubArea?: boolean) => {
      const qp = new URLSearchParams(queryParams.toString());
      if (omitSubArea) qp.delete("subArea");
      const m = pathname.match(/^\/properties\/[^/]+\/([^/]+)(?:\/|$)/);
      if (m?.[1] && newFilters.mainArea === m[1]) {
        qp.delete("mainArea");
      }
      const s = qp.toString();
      return s ? `?${s}` : "";
    };

    if (pathType && pathArea) {
      const newType = newFilters.type || pathType;
      if (!newFilters.mainArea) {
        router.push(`/properties/${newType}${qsForPath(`/properties/${newType}`)}`, { scroll: false });
        return;
      }
      const newArea = newFilters.mainArea;
      if (newArea !== pathArea || newType !== pathType) {
        const dest =
          newArea === "ubud" && newFilters.subArea.length === 1
            ? `/properties/${newType}/ubud/${newFilters.subArea[0]}`
            : `/properties/${newType}/${newArea}`;
        const omitSub = newArea === "ubud" && newFilters.subArea.length === 1;
        router.push(`${dest}${qsForPath(dest, omitSub)}`, { scroll: false });
        return;
      }

      if (newArea === "ubud") {
        if (newFilters.subArea.length === 1) {
          const dest = `/properties/${newType}/ubud/${newFilters.subArea[0]}`;
          router.push(`${dest}${qsForPath(dest, true)}`, { scroll: false });
          return;
        }
        const dest = `/properties/${newType}/ubud`;
        const qp = new URLSearchParams(queryParams.toString());
        if (newFilters.subArea.length > 1) {
          qp.set("subArea", newFilters.subArea.join(","));
        } else {
          qp.delete("subArea");
        }
        const m = dest.match(/^\/properties\/[^/]+\/([^/]+)(?:\/|$)/);
        if (m?.[1] && newFilters.mainArea === m[1]) qp.delete("mainArea");
        const s = qp.toString();
        router.push(`${dest}${s ? `?${s}` : ""}`, { scroll: false });
        return;
      }

      router.push(`${currentPath}${qsForPath(currentPath)}`, { scroll: false });
      return;
    }

    if (isTypeOnlyPath || (pathType && !pathArea)) {
      const newType = newFilters.type || pathType;
      if (!newType) {
        router.push(`/properties${qsForPath("/properties")}`, { scroll: false });
        return;
      }
      if (newFilters.mainArea) {
        const dest =
          newFilters.mainArea === "ubud" && newFilters.subArea.length === 1
            ? `/properties/${newType}/ubud/${newFilters.subArea[0]}`
            : `/properties/${newType}/${newFilters.mainArea}`;
        const omitSub = newFilters.mainArea === "ubud" && newFilters.subArea.length === 1;
        router.push(`${dest}${qsForPath(dest, omitSub)}`, { scroll: false });
      } else {
        router.push(`/properties/${newType}${qsForPath(`/properties/${newType}`)}`, { scroll: false });
      }
      return;
    }

    if (newFilters.type && newFilters.mainArea) {
      const dest =
        newFilters.mainArea === "ubud" && newFilters.subArea.length === 1
          ? `/properties/${newFilters.type}/ubud/${newFilters.subArea[0]}`
          : `/properties/${newFilters.type}/${newFilters.mainArea}`;
      const omitSub = newFilters.mainArea === "ubud" && newFilters.subArea.length === 1;
      router.push(`${dest}${qsForPath(dest, omitSub)}`, { scroll: false });
    } else if (newFilters.type) {
      router.push(`/properties/${newFilters.type}${qsForPath(`/properties/${newFilters.type}`)}`, { scroll: false });
    } else {
      router.push(`/properties${qsForPath("/properties")}`, { scroll: false });
    }
  };

  const handleMainAreaChange = (area: MainArea) => {
    const newFilters = { ...filters, mainArea: area, subArea: [] };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handleSubAreaChange = (subArea: SubArea, checked: boolean) => {
    const newSubAreas = checked
      ? Array.from(new Set([...filters.subArea, subArea])).sort((a, b) =>
          subAreaNames[a].localeCompare(subAreaNames[b])
        )
      : filters.subArea.filter((s) => s !== subArea);
    const newFilters = { ...filters, subArea: newSubAreas };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const bedroomOptions =
    allowedBedroomCounts !== undefined
      ? ALLOWED_BEDROOM_COUNTS.filter((b) => allowedBedroomCounts.includes(b))
      : [...ALLOWED_BEDROOM_COUNTS];
  const handleBedroomChange = (beds: number, checked: boolean) => {
    const newBedrooms = checked
      ? (() => {
          const next = [...filters.bedrooms, beds];
          return Array.from(new Set(next)).sort((a, b) => a - b);
        })()
      : filters.bedrooms.filter((b) => b !== beds);
    const newFilters = { ...filters, bedrooms: newBedrooms };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handleFeatureChange = (feature: keyof PropertyFiltersState, checked: boolean) => {
    const newFilters = { ...filters, [feature]: checked };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  type Action = "Rent" | "Buy";
  type Subject = "Villas" | "Land" | "Business";
  const actionByType: Record<PropertyType, Action> = {
    rent: "Rent",
    sale: "Buy",
    land: "Buy",
    business: "Buy",
  };
  const subjectByType: Record<PropertyType, Subject> = {
    rent: "Villas",
    sale: "Villas",
    land: "Land",
    business: "Business",
  };
  function typeFromActionSubject(action: Action, subject: Subject): PropertyType {
    if (action === "Rent") return "rent";
    if (subject === "Villas") return "sale";
    if (subject === "Land") return "land";
    return "business";
  }
  const action = filters.type ? actionByType[filters.type] : undefined;
  const subject = filters.type ? subjectByType[filters.type] : undefined;
  const subjectOptions: Subject[] = action === "Rent" ? ["Villas"] : ["Villas", "Land", "Business"];

  const handleActionChange = (newAction: Action) => {
    const newSubject: Subject =
      newAction === "Rent" ? "Villas" : subject === "Villas" || subject === "Land" || subject === "Business" ? subject : "Villas";
    const newType = typeFromActionSubject(newAction, newSubject);
    const newFilters = {
      ...filters,
      type: newType,
      minDuration: newAction === "Buy" ? undefined : filters.mainArea ? (filters.minDuration ?? 1) : undefined,
    };
    setFilters(newFilters);
    if (filters.mainArea) {
      const a = filters.mainArea;
      if (a === "ubud" && filters.subArea.length === 1) {
        router.push(`/properties/${newType}/ubud/${filters.subArea[0]}`, { scroll: false });
      } else {
        router.push(`/properties/${newType}/${a}`, { scroll: false });
      }
    } else updateURL(newFilters);
  };

  const handleSubjectChange = (newSubject: Subject) => {
    const effectiveAction = action ?? "Buy";
    const newType = typeFromActionSubject(effectiveAction, newSubject);
    const newFilters = {
      ...filters,
      type: newType,
      minDuration: newType === "rent" ? (filters.mainArea ? (filters.minDuration ?? 1) : undefined) : undefined,
    };
    setFilters(newFilters);
    if (filters.mainArea) {
      const a = filters.mainArea;
      if (a === "ubud" && filters.subArea.length === 1) {
        router.push(`/properties/${newType}/ubud/${filters.subArea[0]}`, { scroll: false });
      } else {
        router.push(`/properties/${newType}/${a}`, { scroll: false });
      }
    } else updateURL(newFilters);
  };

  /** Sub-area: empty array = any (no sub-area filter), same as bedrooms. */
  const isSubAreaChecked = (s: SubArea) => filters.subArea.includes(s);
  const isBedroomChecked = (b: number) => filters.bedrooms.includes(b);
  const bedroomLabel = (b: number) => (b === 1 ? "1 bed" : `${b} beds`);

  const FEATURES_OPTIONS: { key: keyof PropertyFiltersState; label: string }[] = [
    { key: "hasBathtub", label: "bathtub" },
    { key: "hasCarPark", label: "car park" },
    { key: "hasClosedKitchen", label: "enclosed kitchen" },
    { key: "hasEnclosedLiving", label: "enclosed living" },
    { key: "hasDesk", label: "desk" },
    { key: "hasGarage", label: "garage" },
    { key: "hasHighSpeedWifi", label: "high-speed WiFi" },
    { key: "hasNatureView", label: "nature view" },
    { key: "hasPetFriendly", label: "pet friendly" },
    { key: "hasPool", label: "pool" },
    { key: "hasWashingMachine", label: "washing machine" },
  ];
  const visibleFeatureOptions =
    availableAmenityKeys !== undefined
      ? FEATURES_OPTIONS.filter((f) => availableAmenityKeys.includes(f.key as string))
      : FEATURES_OPTIONS;
  const isRent = action === "Rent";

  /** Chip style aligned with primary actions (rounded-lg, not pill). */
  const pill = (selected: boolean, onClick: () => void, children: React.ReactNode, key?: string) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      className={`
        px-3 py-2 text-sm font-normal rounded-lg border transition-colors duration-150 ease-out
        active:scale-[0.98]
        whitespace-nowrap leading-none
        ${
          selected
            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm hover:bg-emerald-700"
            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
        }
      `}
    >
      {children}
    </button>
  );

  const collapsedBase = "Show filters";
  const countLabel =
    matchingCount === 1 ? "Found 1 property" : `Found ${matchingCount} properties`;

  // Chunkier frame (more expressive than card-matching thin border).
  // Bottom `mb-2` matches catalog top Pagination `mb-2` (gap under Next → filters).
  // Looser gap to grid rollback: `mb-4` on this root div.
  // Lighter “card-style” shell rollback: `rounded-lg border border-gray-200 ... shadow-sm`;
  // older rollback: `p-2.5 md:p-3.5`; toggles `h-12 rounded-xl px-4`.
  return (
    <div className="mb-2 mx-auto w-full max-w-3xl rounded-xl border border-stone-300 bg-white px-3 py-2.5 shadow-sm">
      {isCollapsed ? (
        <button
          type="button"
          onClick={openFilters}
          className="w-full rounded-lg border border-emerald-200/90 bg-btn-hatch-emerald px-3 py-2.5 text-left transition-[transform,border-color,background-color] duration-200 hover:border-emerald-300 active:scale-[0.99] flex items-center justify-between"
          aria-expanded={false}
        >
          <span className="text-sm font-normal text-stone-800">{collapsedBase}</span>
          <span className="text-xs font-normal text-stone-500">{activeFilterParamsCount > 0 ? `${activeFilterParamsCount} active` : "tap to open"}</span>
        </button>
      ) : (
        <div className="flex flex-col gap-2.5 md:gap-3">
          <button
            type="button"
            onClick={closeFilters}
            className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-left hover:border-stone-300 hover:bg-stone-50/80 active:scale-[0.99] transition-[transform,border-color,background-color] duration-200 bg-btn-hatch flex items-center justify-between"
            aria-expanded={true}
          >
            <span className="text-sm font-normal text-stone-800">Hide filters</span>
            <span className="text-xs font-normal text-stone-500">tap to close</span>
          </button>

          <p
            className="px-0.5 text-xs font-normal text-stone-500"
            role="status"
            aria-live="polite"
          >
            {countLabel}
          </p>

          {showVillasSpecificBlocks && (
            <>
              <section className="pt-2 border-t border-gray-100">
                <p className="text-xs font-normal text-stone-500 uppercase tracking-wide mb-1.5">Rent or buy</p>
                <div className="flex gap-2 overflow-x-auto pb-1 md:overflow-visible md:flex-wrap md:pb-0 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                  {pill(
                    !action,
                    () => {
                      const newFilters = { ...filters, type: undefined, minDuration: undefined };
                      setFilters(newFilters);
                      updateURL(newFilters);
                    },
                    "any"
                  )}
                  {(["Rent", "Buy"] as const).map((a) =>
                    pill(action === a, () => handleActionChange(a), a.toLowerCase(), `action-${a}`)
                  )}
                </div>
              </section>

              {isRent && (
                <section className="pt-2 border-t border-gray-100">
                  <p className="text-xs font-normal text-stone-500 uppercase tracking-wide mb-1.5">Payment</p>
                  <div className="flex gap-2 overflow-x-auto pb-1 md:overflow-visible md:flex-wrap md:pb-0">
                    {pill(!filters.minDuration || (filters.minDuration !== 1 && filters.minDuration !== 12), () => {
                      const newFilters = { ...filters, minDuration: undefined };
                      setFilters(newFilters);
                      updateURL(newFilters);
                    }, "any")}
                    {pill(filters.minDuration === 1, () => {
                      const newFilters = { ...filters, minDuration: 1 };
                      setFilters(newFilters);
                      updateURL(newFilters);
                    }, "monthly")}
                    {pill(filters.minDuration === 12, () => {
                      const newFilters = { ...filters, minDuration: 12 };
                      setFilters(newFilters);
                      updateURL(newFilters);
                    }, "yearly")}
                  </div>
                </section>
              )}
            </>
          )}

          {showSubjectBlock && (
            <section className="pt-2 border-t border-gray-100">
              <p className="text-xs font-normal text-stone-500 uppercase tracking-wide mb-1.5">Type</p>
              <div className="flex gap-2 overflow-x-auto pb-1 md:overflow-visible md:flex-wrap md:pb-0">
                {pill(!subject, () => {
                  const newFilters = { ...filters, type: undefined };
                  setFilters(newFilters);
                  updateURL(newFilters);
                }, "all types")}
                {subjectOptions.map((s) =>
                  pill(subject === s, () => handleSubjectChange(s), s.toLowerCase(), `subject-${s}`)
                )}
              </div>
            </section>
          )}

          <section className="pt-2 border-t border-gray-100">
            <p className="text-xs font-normal text-stone-500 uppercase tracking-wide mb-1.5">Area</p>
            <div className="flex gap-2 overflow-x-auto pb-1 md:overflow-visible md:flex-wrap md:pb-0 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
              {pill(!filters.mainArea, () => {
                const newFilters = { ...filters, mainArea: undefined, subArea: [] };
                setFilters(newFilters);
                updateURL(newFilters);
              }, "any")}
              {areasToShow.map((area) =>
                pill(
                  filters.mainArea === area.id,
                  () => handleMainAreaChange(area.id),
                  area.nameEn.toLowerCase(),
                  `area-${area.id}`
                )
              )}
            </div>
          </section>

          {subAreaOptions.length > 0 && (
            <section className="pt-2 border-t border-gray-100">
              <p className="text-xs font-normal text-stone-500 uppercase tracking-wide mb-1.5">Sub-area</p>
              <div className="flex gap-2 overflow-x-auto pb-1 md:overflow-visible md:flex-wrap md:pb-0">
                {pill(filters.subArea.length === 0, () => {
                  const newFilters = { ...filters, subArea: [] };
                  setFilters(newFilters);
                  updateURL(newFilters);
                }, "any", "sub-any")}
                {subAreaOptions.map((subArea) =>
                  pill(
                    isSubAreaChecked(subArea),
                    () => handleSubAreaChange(subArea, !isSubAreaChecked(subArea)),
                    subAreaNames[subArea].toLowerCase(),
                    `subarea-${subArea}`
                  )
                )}
              </div>
            </section>
          )}

          {showVillasSpecificBlocks && (
            <>
              <section className="pt-2 border-t border-gray-100">
                <p className="text-xs font-normal text-stone-500 uppercase tracking-wide mb-1.5">Bedrooms</p>
                <div className="flex gap-2 overflow-x-auto pb-1 md:overflow-visible md:flex-wrap md:pb-0">
                  {pill(
                    filters.bedrooms.length === 0,
                    () => {
                      const newFilters = { ...filters, bedrooms: [] };
                      setFilters(newFilters);
                      updateURL(newFilters);
                    },
                    "any",
                    "beds-any"
                  )}
                  {bedroomOptions.map((beds) =>
                    pill(
                      isBedroomChecked(beds),
                      () => handleBedroomChange(beds, !isBedroomChecked(beds)),
                      bedroomLabel(beds),
                      `beds-${beds}`
                    )
                  )}
                </div>
              </section>

              {visibleFeatureOptions.length > 0 && (
                <section className="pt-2 border-t border-gray-100">
                  <p className="text-xs font-normal text-stone-500 uppercase tracking-wide mb-1.5">Amenities</p>
                  <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-gray-50/90 p-2 md:p-3">
                    {visibleFeatureOptions.map(({ key, label }) => (
                      <ToggleSwitch
                        key={key}
                        id={`filter-${String(key)}`}
                        label={label}
                        checked={!!filters[key]}
                        onChange={(checked) => handleFeatureChange(key, checked)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-stretch pt-1">
            <button
              type="button"
              onClick={scrollToListings}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-emerald-600 text-white border border-emerald-600 hover:bg-emerald-700 active:scale-[0.99] transition-colors"
            >
              View results
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="flex-1 px-4 py-2.5 text-sm font-normal rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:scale-[0.99] transition-colors"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
