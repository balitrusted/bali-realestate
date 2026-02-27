"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PropertyType, MainArea, SubArea } from "@/types/property";
import { areas, subAreaNames } from "@/types/areas";

interface PropertyFiltersProps {
  defaultType?: PropertyType;
  defaultMainArea?: MainArea;
}

export default function PropertyFilters({ defaultType, defaultMainArea }: PropertyFiltersProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<{
    mainArea?: MainArea;
    subArea: SubArea[];
    bedrooms: number[];
    type?: PropertyType;
    hasBathtub: boolean;
    hasCarPark: boolean;
    hasDesk: boolean;
    hasNatureView: boolean;
    hasPool: boolean;
    minDuration?: number;
    maxPrice?: number;
  }>({
    mainArea: defaultMainArea || (searchParams.get('mainArea') as MainArea) || undefined,
    subArea: [] as SubArea[],
    bedrooms: [] as number[],
    type: defaultType || (searchParams.get('type') as PropertyType) || undefined,
    hasBathtub: searchParams.get('hasBathtub') === 'true',
    hasCarPark: searchParams.get('hasCarPark') === 'true',
    hasDesk: searchParams.get('hasDesk') === 'true',
    hasNatureView: searchParams.get('hasNatureView') === 'true',
    hasPool: searchParams.get('hasPool') === 'true',
    minDuration: searchParams.get('minDuration') ? Number(searchParams.get('minDuration')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
  });

  // Get sub-areas for selected main area
  const availableSubAreas: SubArea[] = (filters.mainArea && areas[filters.mainArea]?.subAreas)
    ? areas[filters.mainArea].subAreas || []
    : [];

  const updateURL = (newFilters: typeof filters) => {
    const params = new URLSearchParams();
    
    if (newFilters.mainArea) params.set('mainArea', newFilters.mainArea);
    if (newFilters.subArea.length > 0) params.set('subArea', newFilters.subArea.join(','));
    if (newFilters.bedrooms.length > 0) params.set('bedrooms', newFilters.bedrooms.join(','));
    if (newFilters.type) params.set('type', newFilters.type);
    if (newFilters.hasBathtub) params.set('hasBathtub', 'true');
    if (newFilters.hasCarPark) params.set('hasCarPark', 'true');
    if (newFilters.hasDesk) params.set('hasDesk', 'true');
    if (newFilters.hasNatureView) params.set('hasNatureView', 'true');
    if (newFilters.hasPool) params.set('hasPool', 'true');
    if (newFilters.minDuration) params.set('minDuration', newFilters.minDuration.toString());
    if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice.toString());

    const currentPath = window.location.pathname;
    const match = currentPath.match(/\/properties\/([^\/]+)\/([^\/]+)/);
    const pathType = match?.[1];
    const pathArea = match?.[2];

    if (match && pathType && pathArea) {
      // On [type]/[area] page: only change path when area or type actually changed
      const newArea = newFilters.mainArea || pathArea;
      const newType = newFilters.type || pathType;
      if (newArea !== pathArea || newType !== pathType) {
        router.push(`/properties/${newType}/${newArea}?${params.toString()}`, { scroll: false });
      } else {
        router.push(`${currentPath}?${params.toString()}`, { scroll: false });
      }
    } else {
      if (newFilters.type && newFilters.mainArea) {
        router.push(`/properties/${newFilters.type}/${newFilters.mainArea}?${params.toString()}`);
      } else {
        router.push(`/properties?${params.toString()}`);
      }
    }
  };

  const handleMainAreaChange = (area: MainArea) => {
    const newFilters = { ...filters, mainArea: area, subArea: [] };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handleSubAreaChange = (subArea: SubArea, checked: boolean) => {
    const currentSelected =
      filters.subArea.length === 0 ? availableSubAreas : filters.subArea;
    let newSubAreas: SubArea[];
    if (checked) {
      newSubAreas = [...filters.subArea, subArea];
      if (newSubAreas.length === availableSubAreas.length) newSubAreas = [];
    } else {
      newSubAreas =
        filters.subArea.length === 0
          ? availableSubAreas.filter((s) => s !== subArea)
          : filters.subArea.filter((s) => s !== subArea);
    }
    const newFilters = { ...filters, subArea: newSubAreas };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const BEDROOMS_OPTIONS = [1, 2, 3, 4] as const;
  const handleBedroomChange = (beds: number, checked: boolean) => {
    let newBedrooms: number[];
    if (checked) {
      newBedrooms = [...filters.bedrooms, beds];
      if (newBedrooms.length === BEDROOMS_OPTIONS.length) newBedrooms = [];
    } else {
      newBedrooms =
        filters.bedrooms.length === 0
          ? BEDROOMS_OPTIONS.filter((b) => b !== beds)
          : filters.bedrooms.filter((b) => b !== beds);
    }
    const newFilters = { ...filters, bedrooms: newBedrooms };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handleFeatureChange = (feature: keyof typeof filters, checked: boolean) => {
    const newFilters = { ...filters, [feature]: checked };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  // Same logic as header: Action (Rent/Buy) + Subject (Villas/Land/Business) → URL type
  type Action = "Rent" | "Buy";
  type Subject = "Villas" | "Land" | "Business";
  const actionByType: Record<PropertyType, Action> = { rent: "Rent", sale: "Buy", land: "Buy", business: "Buy" };
  const subjectByType: Record<PropertyType, Subject> = { rent: "Villas", sale: "Villas", land: "Land", business: "Business" };
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
    const newSubject: Subject = newAction === "Rent" ? "Villas" : (subject === "Villas" || subject === "Land" || subject === "Business" ? subject : "Villas");
    const newType = typeFromActionSubject(newAction, newSubject);
    const newFilters = {
      ...filters,
      type: newType,
      minDuration: newAction === "Buy" ? undefined : (filters.minDuration ?? 1),
    };
    setFilters(newFilters);
    if (filters.mainArea) router.push(`/properties/${newType}/${filters.mainArea}`);
    else updateURL(newFilters);
  };

  const handleSubjectChange = (newSubject: Subject) => {
    if (!action) return;
    const newType = typeFromActionSubject(action, newSubject);
    const newFilters = {
      ...filters,
      type: newType,
      minDuration: newType === "rent" ? (filters.minDuration ?? 1) : undefined,
    };
    setFilters(newFilters);
    if (filters.mainArea) router.push(`/properties/${newType}/${filters.mainArea}`);
    else updateURL(newFilters);
  };

  const [open, setOpen] = useState<Record<string, boolean>>({
    action: false,
    subject: false,
    area: false,
    neighborhood: false,
    bedrooms: false,
    features: false,
    duration: false,
  });
  const toggle = (key: string) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  const block = (key: string, title: string, children: React.ReactNode) => (
    <div className="border border-gray-200 rounded-md overflow-hidden bg-gray-50/50">
      <button
        type="button"
        onClick={() => toggle(key)}
        className="w-full flex items-center justify-between px-3 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-100/80 transition-colors"
      >
        {title}
        <svg
          className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${open[key] ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open[key] && <div className="px-3 pb-3 pt-0 space-y-2 border-t border-gray-100">{children}</div>}
    </div>
  );

  // Value-as-rectangle filters: refs for click-outside to close
  const actionRef = useRef<HTMLDivElement>(null);
  const subjectRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const neighborhoodRef = useRef<HTMLDivElement>(null);
  const bedroomsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const durationRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (actionRef.current && !actionRef.current.contains(target)) setOpen((o) => ({ ...o, action: false }));
      if (subjectRef.current && !subjectRef.current.contains(target)) setOpen((o) => ({ ...o, subject: false }));
      if (areaRef.current && !areaRef.current.contains(target)) setOpen((o) => ({ ...o, area: false }));
      if (neighborhoodRef.current && !neighborhoodRef.current.contains(target)) setOpen((o) => ({ ...o, neighborhood: false }));
      if (bedroomsRef.current && !bedroomsRef.current.contains(target)) setOpen((o) => ({ ...o, bedrooms: false }));
      if (featuresRef.current && !featuresRef.current.contains(target)) setOpen((o) => ({ ...o, features: false }));
      if (durationRef.current && !durationRef.current.contains(target)) setOpen((o) => ({ ...o, duration: false }));
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const areaList = Object.values(areas);
  const otherAreasHint = filters.mainArea
    ? areaList.filter((a) => a.id !== filters.mainArea).map((a) => a.nameEn)
    : areaList.map((a) => a.nameEn);
  const areaHint = otherAreasHint.length > 0 ? `(or ${otherAreasHint.map((n) => n.toLowerCase()).join(", ")})` : "";

  const neighborhoodDisplay =
    availableSubAreas.length > 0
      ? filters.subArea.length === 0
        ? "all areas"
        : [...filters.subArea]
            .map((s) => subAreaNames[s].toLowerCase())
            .join(", ")
      : "";
  const neighborhoodUnselected =
    availableSubAreas.length > 0 && filters.subArea.length > 0
      ? availableSubAreas.filter((s) => !filters.subArea.includes(s))
      : [];
  const neighborhoodHint =
    availableSubAreas.length > 0
      ? filters.subArea.length === 0
        ? `(or ${availableSubAreas.map((s) => subAreaNames[s].toLowerCase()).join(", ")})`
        : neighborhoodUnselected.length > 0
          ? `(or ${neighborhoodUnselected.map((s) => subAreaNames[s].toLowerCase()).join(", ")})`
          : ""
      : "";
  const isSubAreaChecked = (s: SubArea) =>
    filters.subArea.length === 0 || filters.subArea.includes(s);

  const bedroomLabel = (b: number) => (b === 1 ? "1 bed" : `${b} beds`);
  const bedroomsDisplay =
    filters.bedrooms.length === 0
      ? "all beds"
      : [...filters.bedrooms].sort((a, b) => a - b).map(bedroomLabel).join(", ");
  const bedroomsUnselected =
    filters.bedrooms.length === 0
      ? []
      : BEDROOMS_OPTIONS.filter((b) => !filters.bedrooms.includes(b));
  const bedroomsHint =
    filters.bedrooms.length === 0
      ? `(or ${BEDROOMS_OPTIONS.map(bedroomLabel).join(", ")})`
      : bedroomsUnselected.length > 0
        ? `(or ${bedroomsUnselected.map(bedroomLabel).join(", ")})`
        : "";
  const isBedroomChecked = (b: number) =>
    filters.bedrooms.length === 0 || filters.bedrooms.includes(b);

  const FEATURES_OPTIONS: { key: keyof typeof filters; label: string }[] = [
    { key: "hasBathtub", label: "bathtub" },
    { key: "hasCarPark", label: "car park" },
    { key: "hasDesk", label: "desk" },
    { key: "hasNatureView", label: "nature view" },
    { key: "hasPool", label: "pool" },
  ];
  const hasAnyFeature = FEATURES_OPTIONS.some((f) => filters[f.key]);
  const amenitiesDisplay = hasAnyFeature
    ? FEATURES_OPTIONS.filter((f) => filters[f.key]).map((f) => f.label).join(", ")
    : "any amenities";
  const amenitiesUnselected = hasAnyFeature
    ? FEATURES_OPTIONS.filter((f) => !filters[f.key]).map((f) => f.label)
    : FEATURES_OPTIONS.map((f) => f.label);
  const amenitiesHint =
    amenitiesUnselected.length > 0 ? `(or ${amenitiesUnselected.join(", ")})` : "";

  const isRent = action === "Rent";
  const paymentDisplay = isRent
    ? (filters.minDuration === 12 ? "pay yearly" : "pay monthly")
    : "full payment";
  const paymentHint = isRent
    ? (filters.minDuration === 12 ? "(or pay monthly)" : "(or pay yearly)")
    : "";

  const subjectHint =
    subject === "Villas"
      ? "(or land, business)"
      : subject === "Land"
        ? "(or villas, business)"
        : subject === "Business"
          ? "(or villas, land)"
          : "(villas, land, business)";

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="text-base font-semibold text-gray-900 mb-3">filters</h2>
      <div className="space-y-2">
        {/* Rent or Buy: value-as-rectangle — user sees "Rent", clicks to open and pick Rent/Buy */}
        <div className="border border-gray-200 rounded-md overflow-hidden bg-gray-50/50" ref={actionRef}>
          <button
            type="button"
            onClick={() => toggle("action")}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-100/80 transition-colors"
          >
            <span className="min-w-0 overflow-hidden whitespace-nowrap">
              <span className="border-b border-dashed border-gray-500 font-semibold">
                {action ? action.toLowerCase() : "—"}
              </span>
              <span className="ml-1.5 text-xs font-normal text-gray-500">
                ({action === "Rent" ? "or buy" : action === "Buy" ? "or rent" : "rent or buy"})
              </span>
            </span>
            <svg
              className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${open.action ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {open.action && (
            <div className="border-t border-gray-200 bg-white px-2 py-2 space-y-0.5">
              {(["Rent", "Buy"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    handleActionChange(a);
                    setOpen((o) => ({ ...o, action: false }));
                  }}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${action === a ? "font-semibold text-gray-900 bg-gray-50" : "text-gray-700"}`}
                >
                  {a.toLowerCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Payment: Rent = Pay monthly / Pay yearly; Buy = Full payment (automatic) — second after Rent or Buy */}
        <div className="border border-gray-200 rounded-md overflow-hidden bg-gray-50/50" ref={durationRef}>
          <button
            type="button"
            onClick={() => isRent && toggle("duration")}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium text-gray-900 transition-colors ${isRent ? "hover:bg-gray-100/80 cursor-pointer" : "cursor-default"}`}
          >
            <span className="min-w-0 overflow-hidden whitespace-nowrap">
              <span className="border-b border-dashed border-gray-500 font-semibold">
                {paymentDisplay}
              </span>
              {paymentHint && <span className="ml-1.5 text-xs font-normal text-gray-500">{paymentHint}</span>}
            </span>
            {isRent && (
              <svg
                className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${open.duration ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          {isRent && open.duration && (
            <div className="border-t border-gray-200 bg-white px-2 py-2 space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  const newFilters = { ...filters, minDuration: 1 };
                  setFilters(newFilters);
                  updateURL(newFilters);
                  setOpen((o) => ({ ...o, duration: false }));
                }}
                className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${filters.minDuration === 1 ? "font-semibold text-gray-900 bg-gray-50" : "text-gray-700"}`}
              >
                pay monthly
              </button>
              <button
                type="button"
                onClick={() => {
                  const newFilters = { ...filters, minDuration: 12 };
                  setFilters(newFilters);
                  updateURL(newFilters);
                  setOpen((o) => ({ ...o, duration: false }));
                }}
                className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${filters.minDuration === 12 ? "font-semibold text-gray-900 bg-gray-50" : "text-gray-700"}`}
              >
                pay yearly
              </button>
            </div>
          )}
        </div>

        {/* Type: value-as-rectangle — shows "Villas", hint "(or Land, or Business)" */}
        <div className="border border-gray-200 rounded-md overflow-hidden bg-gray-50/50" ref={subjectRef}>
          <button
            type="button"
            onClick={() => toggle("subject")}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-100/80 transition-colors"
          >
            <span className="min-w-0 overflow-hidden whitespace-nowrap">
              <span className="border-b border-dashed border-gray-500 font-semibold">
                {subject ? subject.toLowerCase() : "—"}
              </span>
              <span className="ml-1.5 text-xs font-normal text-gray-500">{subjectHint}</span>
            </span>
            <svg
              className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${open.subject ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {open.subject && (
            <div className="border-t border-gray-200 bg-white px-2 py-2 space-y-0.5">
              {subjectOptions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    handleSubjectChange(s);
                    setOpen((o) => ({ ...o, subject: false }));
                  }}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${subject === s ? "font-semibold text-gray-900 bg-gray-50" : "text-gray-700"}`}
                >
                  {s.toLowerCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Area: value-as-rectangle — shows current area name, hint "(or Canggu, or Sanur)" etc. */}
        <div className="border border-gray-200 rounded-md overflow-hidden bg-gray-50/50" ref={areaRef}>
          <button
            type="button"
            onClick={() => toggle("area")}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-100/80 transition-colors"
          >
            <span className="min-w-0 overflow-hidden whitespace-nowrap">
              <span className="border-b border-dashed border-gray-500 font-semibold">
                {filters.mainArea ? areas[filters.mainArea].nameEn.toLowerCase() : "—"}
              </span>
              {areaHint && <span className="ml-1.5 text-xs font-normal text-gray-500">{areaHint}</span>}
            </span>
            <svg
              className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${open.area ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {open.area && (
            <div className="border-t border-gray-200 bg-white px-2 py-2 space-y-0.5">
              {areaList.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => {
                    handleMainAreaChange(area.id);
                    setOpen((o) => ({ ...o, area: false }));
                  }}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${filters.mainArea === area.id ? "font-semibold text-gray-900 bg-gray-50" : "text-gray-700"}`}
                >
                  {area.nameEn.toLowerCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        {availableSubAreas.length > 0 && (
          <div className="border border-gray-200 rounded-md overflow-hidden bg-gray-50/50" ref={neighborhoodRef}>
            <button
              type="button"
              onClick={() => toggle("neighborhood")}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-100/80 transition-colors"
            >
              <span className="min-w-0 overflow-hidden whitespace-nowrap">
                <span className="border-b border-dashed border-gray-500 font-semibold">
                  {neighborhoodDisplay}
                </span>
                {neighborhoodHint && <span className="ml-1.5 text-xs font-normal text-gray-500">{neighborhoodHint}</span>}
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${open.neighborhood ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {open.neighborhood && (
              <div className="border-t border-gray-200 bg-white px-2 py-2 space-y-0.5">
                {availableSubAreas.map((subArea) => (
                  <label key={subArea} className="flex items-center cursor-pointer px-2 py-1.5 rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={isSubAreaChecked(subArea)}
                      onChange={(e) => handleSubAreaChange(subArea, e.target.checked)}
                      className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{subAreaNames[subArea].toLowerCase()}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bedrooms: value-as-rectangle — "All bedrooms" by default, hint "(or 1 bedroom, ...)" */}
        <div className="border border-gray-200 rounded-md overflow-hidden bg-gray-50/50" ref={bedroomsRef}>
          <button
            type="button"
            onClick={() => toggle("bedrooms")}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-100/80 transition-colors"
          >
            <span className="min-w-0 overflow-hidden whitespace-nowrap">
              <span className="border-b border-dashed border-gray-500 font-semibold">
                {bedroomsDisplay}
              </span>
              {bedroomsHint && <span className="ml-1.5 text-xs font-normal text-gray-500">{bedroomsHint}</span>}
            </span>
            <svg
              className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${open.bedrooms ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {open.bedrooms && (
            <div className="border-t border-gray-200 bg-white px-2 py-2 space-y-0.5">
              {BEDROOMS_OPTIONS.map((beds) => (
                <label key={beds} className="flex items-center cursor-pointer px-2 py-1.5 rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={isBedroomChecked(beds)}
                    onChange={(e) => handleBedroomChange(beds, e.target.checked)}
                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{bedroomLabel(beds)}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Amenities: value-as-rectangle — "No specific amenities" by default, user checks what they need */}
        <div className="border border-gray-200 rounded-md overflow-hidden bg-gray-50/50" ref={featuresRef}>
          <button
            type="button"
            onClick={() => toggle("features")}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-100/80 transition-colors"
          >
            <span className="min-w-0 overflow-hidden whitespace-nowrap">
              <span className="border-b border-dashed border-gray-500 font-semibold">
                {amenitiesDisplay}
              </span>
              {amenitiesHint && <span className="ml-1.5 text-xs font-normal text-gray-500">{amenitiesHint}</span>}
            </span>
            <svg
              className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${open.features ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {open.features && (
            <div className="border-t border-gray-200 bg-white px-2 py-2 space-y-0.5">
              {FEATURES_OPTIONS.map(({ key, label }) => (
                <label key={key} className="flex items-center cursor-pointer px-2 py-1.5 rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={!!filters[key]}
                    onChange={(e) => handleFeatureChange(key, e.target.checked)}
                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => {
            const clearedFilters = {
              mainArea: undefined,
              subArea: [],
              bedrooms: [],
              type: undefined,
              hasBathtub: false,
              hasCarPark: false,
              hasDesk: false,
              hasNatureView: false,
              hasPool: false,
              minDuration: undefined,
              maxPrice: undefined,
            };
            setFilters(clearedFilters);
            router.push("/properties");
          }}
          className="w-full px-3 py-2 mt-1 text-sm bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 transition-colors"
        >
          clear filters
        </button>
      </div>
    </div>
  );
}
