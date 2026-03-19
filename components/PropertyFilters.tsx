"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PropertyType, MainArea, SubArea } from "@/types/property";
import { areas, subAreaNames } from "@/types/areas";
import ToggleSwitch from "@/components/ToggleSwitch";

interface PropertyFiltersProps {
  defaultType?: PropertyType;
  defaultMainArea?: MainArea;
  /** Only show these amenity checkboxes (filter keys like "hasPool"). If empty/undefined, show all. */
  availableAmenityKeys?: string[];
  /** Limits visible filter blocks to the current "base" catalog category. */
  baseVariant?: "villas" | "land" | "business";
}

export default function PropertyFilters({
  defaultType,
  defaultMainArea,
  availableAmenityKeys,
  baseVariant,
}: PropertyFiltersProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<{
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
  }>({
    mainArea: defaultMainArea || (searchParams.get('mainArea') as MainArea) || undefined,
    subArea: [] as SubArea[],
    bedrooms: [] as number[],
    type: defaultType || (searchParams.get('type') as PropertyType) || undefined,
    hasBathtub: searchParams.get('hasBathtub') === 'true',
    hasCarPark: searchParams.get('hasCarPark') === 'true',
    hasClosedKitchen: searchParams.get('hasClosedKitchen') === 'true',
    hasDesk: searchParams.get('hasDesk') === 'true',
    hasEnclosedLiving: searchParams.get('hasEnclosedLiving') === 'true',
    hasGarage: searchParams.get('hasGarage') === 'true',
    hasHighSpeedWifi: searchParams.get('hasHighSpeedWifi') === 'true',
    hasNatureView: searchParams.get('hasNatureView') === 'true',
    hasPetFriendly: searchParams.get('hasPetFriendly') === 'true',
    hasPool: searchParams.get('hasPool') === 'true',
    hasWashingMachine: searchParams.get('hasWashingMachine') === 'true',
    minDuration: searchParams.get('minDuration') ? Number(searchParams.get('minDuration')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
  });

  const constrainedBase = baseVariant != null;
  const isVillasBase = baseVariant === "villas";
  const showVillasSpecificBlocks = !constrainedBase || isVillasBase;
  const showSubjectBlock = !constrainedBase;

  // Get sub-areas for selected main area
  const availableSubAreas: SubArea[] = (filters.mainArea && areas[filters.mainArea]?.subAreas)
    ? areas[filters.mainArea].subAreas || []
    : [];
  const areaList = Object.values(areas);

  const updateURL = (newFilters: typeof filters) => {
    const currentPath = window.location.pathname;
    const matchSegment = currentPath.match(/\/properties\/([^\/]+)\/([^\/]+)(?:\/([^\/]+))?/);
    const matchTypeOnly = currentPath.match(/^\/properties\/(rent|sale|land|business|villas)$/);
    const isTypeOnlyPath = !!matchTypeOnly;
    const pathType = matchSegment?.[1] ?? matchTypeOnly?.[1];
    const pathArea = matchSegment?.[2];
    const pathSegment = matchSegment?.[3];

    const queryParams = new URLSearchParams();
    if (newFilters.mainArea) queryParams.set('mainArea', newFilters.mainArea);
    if (newFilters.subArea.length > 0) queryParams.set('subArea', newFilters.subArea.join(','));
    if (newFilters.bedrooms.length > 0) queryParams.set('bedrooms', newFilters.bedrooms.join(','));
    if (newFilters.hasBathtub) queryParams.set('hasBathtub', 'true');
    if (newFilters.hasCarPark) queryParams.set('hasCarPark', 'true');
    if (newFilters.hasClosedKitchen) queryParams.set('hasClosedKitchen', 'true');
    if (newFilters.hasDesk) queryParams.set('hasDesk', 'true');
    if (newFilters.hasEnclosedLiving) queryParams.set('hasEnclosedLiving', 'true');
    if (newFilters.hasGarage) queryParams.set('hasGarage', 'true');
    if (newFilters.hasHighSpeedWifi) queryParams.set('hasHighSpeedWifi', 'true');
    if (newFilters.hasNatureView) queryParams.set('hasNatureView', 'true');
    if (newFilters.hasPetFriendly) queryParams.set('hasPetFriendly', 'true');
    if (newFilters.hasPool) queryParams.set('hasPool', 'true');
    if (newFilters.hasWashingMachine) queryParams.set('hasWashingMachine', 'true');
    if (newFilters.minDuration) queryParams.set('minDuration', newFilters.minDuration.toString());
    if (newFilters.maxPrice) queryParams.set('maxPrice', newFilters.maxPrice.toString());

    const queryString = queryParams.toString();

    if (pathType && pathArea) {
      const newArea = newFilters.mainArea || pathArea;
      const newType = newFilters.type || pathType;
      const segmentPart = pathSegment ? `/${pathSegment}` : "";
      if (newArea !== pathArea || newType !== pathType) {
        router.push(`/properties/${newType}/${newArea}${segmentPart}${queryString ? `?${queryString}` : ""}`, { scroll: false });
      } else {
        router.push(`${currentPath}${queryString ? `?${queryString}` : ""}`, { scroll: false });
      }
      return;
    }

    if (isTypeOnlyPath || (pathType && !pathArea)) {
      const newType = newFilters.type || pathType;
      if (!newType) {
        router.push(`/properties${queryString ? `?${queryString}` : ""}`, { scroll: false });
        return;
      }
      if (newFilters.mainArea) {
        router.push(`/properties/${newType}/${newFilters.mainArea}${queryString ? `?${queryString}` : ""}`, { scroll: false });
      } else {
        router.push(`/properties/${newType}${queryString ? `?${queryString}` : ""}`, { scroll: false });
      }
      return;
    }

    if (newFilters.type && newFilters.mainArea) {
      router.push(`/properties/${newFilters.type}/${newFilters.mainArea}${queryString ? `?${queryString}` : ""}`);
    } else if (newFilters.type) {
      router.push(`/properties/${newFilters.type}${queryString ? `?${queryString}` : ""}`);
    } else {
      router.push(`/properties${queryString ? `?${queryString}` : ""}`);
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
      minDuration: newAction === "Buy" ? undefined : (filters.mainArea ? (filters.minDuration ?? 1) : undefined),
    };
    setFilters(newFilters);
    if (filters.mainArea) router.push(`/properties/${newType}/${filters.mainArea}`);
    else updateURL(newFilters);
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
    if (filters.mainArea) router.push(`/properties/${newType}/${filters.mainArea}`);
    else updateURL(newFilters);
  };

  const isSubAreaChecked = (s: SubArea) =>
    filters.subArea.length === 0 || filters.subArea.includes(s);
  const isBedroomChecked = (b: number) =>
    filters.bedrooms.length === 0 || filters.bedrooms.includes(b);
  const bedroomLabel = (b: number) => (b === 1 ? "1 bed" : `${b} beds`);

  const FEATURES_OPTIONS: { key: keyof typeof filters; label: string }[] = [
    { key: "hasBathtub", label: "bathtub" },
    { key: "hasCarPark", label: "car park" },
    { key: "hasClosedKitchen", label: "closed kitchen" },
    { key: "hasDesk", label: "desk" },
    { key: "hasEnclosedLiving", label: "enclosed living" },
    { key: "hasGarage", label: "garage" },
    { key: "hasHighSpeedWifi", label: "high-speed WiFi" },
    { key: "hasNatureView", label: "nature view" },
    { key: "hasPetFriendly", label: "pet friendly" },
    { key: "hasPool", label: "pool" },
    { key: "hasWashingMachine", label: "washing machine" },
  ];
  const visibleFeatureOptions = availableAmenityKeys?.length
    ? FEATURES_OPTIONS.filter((f) => availableAmenityKeys.includes(f.key))
    : FEATURES_OPTIONS;
  const isRent = action === "Rent";

  const pill = (
    selected: boolean,
    onClick: () => void,
    children: React.ReactNode,
    key?: string
  ) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      className={`
        px-3 py-1.5 text-sm font-medium rounded-full border transition-all duration-200 ease-out
        active:scale-[0.97]
        ${selected
          ? "bg-emerald-500 text-white border-emerald-500 shadow-sm hover:bg-emerald-600 hover:shadow"
          : "bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200 hover:border-gray-200"
        }
      `}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-3 md:p-5 shadow-sm">
      <h2 className="text-sm md:text-base font-semibold text-gray-900 mb-3 md:mb-4">Filters</h2>
      <div className="space-y-4 md:space-y-5">
        {showVillasSpecificBlocks && (
          <>
            <section>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 md:mb-2">Rent or buy</p>
              <div className="flex gap-2 overflow-x-auto pb-1 md:overflow-visible md:flex-wrap md:pb-0 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                {pill(!action, () => {
                  const newFilters = { ...filters, type: undefined, minDuration: undefined };
                  setFilters(newFilters);
                  updateURL(newFilters);
                }, "any")}
                {(["Rent", "Buy"] as const).map((a) =>
                  pill(action === a, () => handleActionChange(a), a.toLowerCase(), `action-${a}`)
                )}
              </div>
            </section>

            {isRent && (
              <section>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 md:mb-2">Payment</p>
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
          <section>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 md:mb-2">Type</p>
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

        <section>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Area</p>
          <div className="flex gap-2 overflow-x-auto pb-1 md:overflow-visible md:flex-wrap md:pb-0 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {pill(!filters.mainArea, () => {
              const newFilters = { ...filters, mainArea: undefined, subArea: [] };
              setFilters(newFilters);
              updateURL(newFilters);
            }, "all")}
            {areaList.map((area) =>
              pill(
                filters.mainArea === area.id,
                () => handleMainAreaChange(area.id),
                area.nameEn.toLowerCase(),
                `area-${area.id}`
              )
            )}
          </div>
        </section>

        {availableSubAreas.length > 0 && (
          <section>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 md:mb-2">Sub-area</p>
            <div className="flex gap-2 overflow-x-auto pb-1 md:overflow-visible md:flex-wrap md:pb-0">
              {availableSubAreas.map((subArea) =>
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
            <section>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 md:mb-2">Bedrooms</p>
              <div className="flex gap-2 overflow-x-auto pb-1 md:overflow-visible md:flex-wrap md:pb-0">
                {BEDROOMS_OPTIONS.map((beds) =>
                  pill(
                    isBedroomChecked(beds),
                    () => handleBedroomChange(beds, !isBedroomChecked(beds)),
                    bedroomLabel(beds),
                    `beds-${beds}`
                  )
                )}
              </div>
            </section>

            <section>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 md:mb-2">Amenities</p>
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50/50 p-2 md:p-3">
                {visibleFeatureOptions.map(({ key, label }) => (
                  <ToggleSwitch
                    key={key}
                    id={`filter-${key}`}
                    label={label}
                    checked={!!filters[key]}
                    onChange={(checked) => handleFeatureChange(key, checked)}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        <button
          onClick={() => {
            const clearedFilters = {
              mainArea: undefined,
              subArea: [],
              bedrooms: [],
              type: undefined,
              hasBathtub: false,
              hasCarPark: false,
              hasClosedKitchen: false,
              hasDesk: false,
              hasEnclosedLiving: false,
              hasGarage: false,
              hasHighSpeedWifi: false,
              hasNatureView: false,
              hasPetFriendly: false,
              hasPool: false,
              hasWashingMachine: false,
              minDuration: undefined,
              maxPrice: undefined,
            };
            setFilters(clearedFilters);
            const currentPath = window.location.pathname;
            const matchTypeOnly = currentPath.match(/^\/properties\/(rent|sale|land|business|villas)$/);
            const matchSegment = currentPath.match(/\/properties\/([^\/]+)\/([^\/]+)(?:\/([^\/]+))?/);
            const destinationType = matchTypeOnly?.[1] ?? matchSegment?.[1];
            router.push(destinationType ? `/properties/${destinationType}` : "/properties");
          }}
          className="w-full px-4 py-2.5 mt-2 text-sm font-medium bg-gray-100 text-gray-800 rounded-xl border border-gray-200 hover:bg-gray-200 hover:border-gray-300 active:scale-[0.99] transition-all duration-200"
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}
