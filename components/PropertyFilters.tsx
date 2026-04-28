"use client";

/**
 * Catalog filter UI (step wizard + chips + amenities).
 *
 * Rollback to pre-wizard layout: the repo keeps a pointer branch at
 *   backup/catalog-filters-legacy-2026-04-18
 * Restore file only:
 *   git checkout backup/catalog-filters-legacy-2026-04-18 -- components/PropertyFilters.tsx
 */

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PropertyType, MainArea, SubArea } from "@/types/property";
import { areas, subAreaNames } from "@/types/areas";
import { getMergedAreaInfos, isValidMainAreaSlug } from "@/lib/mainAreaRegistry";
import { ALLOWED_BEDROOM_COUNTS } from "@/lib/catalogBedrooms";
import ToggleSwitch from "@/components/ToggleSwitch";

type WizardStepId = "action" | "payment" | "subject" | "area" | "subarea" | "bedrooms";
type WizardSkipState = {
  action: boolean;
  payment: boolean;
  subject: boolean;
  area: boolean;
  bedrooms: boolean;
};

/** Catalog URL slug → listing `PropertyType`. `/properties/villas` is a hub, not a concrete type. */
function parseTypeFromPropertiesPath(pathname: string): PropertyType | undefined {
  const m = pathname.match(/^\/properties\/([^/]+)(?:\/|$)/);
  const t = m?.[1];
  if (!t || t === "villas") return undefined;
  if (t === "rent" || t === "sale" || t === "land" || t === "business") return t;
  return undefined;
}

const FILTERS_EXPANDED_KEY = "balitrusted-catalog-filters-expanded";

type WizardStepIdOrDone = WizardStepId | "done";

function parseMainAreaFromPropertiesPath(pathname: string): MainArea | undefined {
  const m = pathname.match(/^\/properties\/(?:villas|rent|sale|land|business)\/([^/]+)(?:\/|$)/);
  const slug = m?.[1];
  if (!slug || !isValidMainAreaSlug(slug)) return undefined;
  return slug as MainArea;
}

function taxonomySubAreaCount(mainArea?: MainArea): number {
  if (!mainArea) return 0;
  const entry = areas[mainArea as keyof typeof areas];
  return entry?.subAreas?.length ?? 0;
}

/** First step that still needs a choice; otherwise last step (refine / amenities path). */
function suggestedWizardStep(
  f: PropertyFiltersState,
  visible: WizardStepId[],
  showVillas: boolean,
  showSubject: boolean,
  subAreaPromptSkipped: boolean,
  skipped: WizardSkipState
): WizardStepId {
  if (visible.length === 0) return "area";
  const needs = (id: WizardStepId): boolean => {
    switch (id) {
      case "action":
        return showVillas && !f.type && !skipped.action;
      case "payment":
        return (
          showVillas &&
          f.type === "rent" &&
          f.minDuration !== 1 &&
          f.minDuration !== 12 &&
          !skipped.payment
        );
      case "subject":
        return showSubject && !f.type && !skipped.subject;
      case "area":
        return !f.mainArea && !skipped.area;
      case "subarea":
        return (
          !subAreaPromptSkipped &&
          taxonomySubAreaCount(f.mainArea) > 0 &&
          f.subArea.length === 0
        );
      case "bedrooms":
        return !skipped.bedrooms;
      default:
        return false;
    }
  };
  for (const id of visible) {
    if (needs(id)) return id;
  }
  return visible[visible.length - 1]!;
}

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
  pathSubArea?: SubArea,
  pathname?: string
): PropertyFiltersState {
  const pathMainArea = pathname ? parseMainAreaFromPropertiesPath(pathname) : undefined;
  const pathType = pathname ? parseTypeFromPropertiesPath(pathname) : undefined;
  return {
    mainArea: defaultMainArea || pathMainArea || (searchParams.get("mainArea") as MainArea) || undefined,
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
    type: defaultType || pathType || (searchParams.get("type") as PropertyType) || undefined,
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
  allowedMainAreas?: MainArea[];
  allowedSubAreas?: SubArea[];
  allowedBedroomCounts?: number[];
  availableAmenityKeys?: string[];
  baseVariant?: "villas" | "land" | "business";
  matchingCount: number;
  pathSubArea?: SubArea;
}

function Spinner() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-1 py-4 text-stone-600"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <svg
        className="h-6 w-6 animate-spin text-emerald-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="text-sm font-medium text-stone-500">Updating…</span>
    </div>
  );
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
  const [isPending, startTransition] = useTransition();

  const [isCollapsed, setIsCollapsed] = useState(true);
  /** After "Any" on sub-areas, stop forcing the sub-area step when reopening the wizard. */
  const [subAreaPromptSkipped, setSubAreaPromptSkipped] = useState(false);
  const [wizardSkipped, setWizardSkipped] = useState<WizardSkipState>({
    action: false,
    payment: false,
    subject: false,
    area: false,
    bedrooms: false,
  });
  const [filters, setFilters] = useState<PropertyFiltersState>(() =>
    buildFiltersFromSearchParams(searchParams, defaultMainArea, defaultType, pathSubArea, pathname)
  );
  const [currentStepId, setCurrentStepId] = useState<WizardStepIdOrDone>("action");

  useEffect(() => {
    setFilters(buildFiltersFromSearchParams(searchParams, defaultMainArea, defaultType, pathSubArea, pathname));
  }, [searchKey, searchParams, defaultMainArea, defaultType, pathSubArea, pathname]);

  useEffect(() => {
    setSubAreaPromptSkipped(false);
  }, [filters.mainArea]);

  /** Stay expanded across client navigations (RSC remount resets useState); first visit stays collapsed. */
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && sessionStorage.getItem(FILTERS_EXPANDED_KEY) === "1") {
        setIsCollapsed(false);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const openFilters = useCallback(() => {
    setIsCollapsed(false);
    try {
      sessionStorage.setItem(FILTERS_EXPANDED_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const closeFilters = useCallback(() => {
    setIsCollapsed(true);
    try {
      sessionStorage.removeItem(FILTERS_EXPANDED_KEY);
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

  const hideFiltersAndViewListings = useCallback(() => {
    scrollToListings();
    setIsCollapsed(true);
    try {
      sessionStorage.removeItem(FILTERS_EXPANDED_KEY);
    } catch {
      /* ignore */
    }
  }, [scrollToListings]);

  /** Full reset to clean SEO hub URLs (no query) — same entry points as legacy redirects. */
  const clearFilters = useCallback(() => {
    setSubAreaPromptSkipped(false);
    setWizardSkipped({
      action: false,
      payment: false,
      subject: false,
      area: false,
      bedrooms: false,
    });
    setIsCollapsed(true);
    try {
      sessionStorage.removeItem(FILTERS_EXPANDED_KEY);
    } catch {
      /* ignore */
    }
    if (baseVariant === "land") {
      router.push("/properties/land", { scroll: true });
      return;
    }
    if (baseVariant === "business") {
      router.push("/properties/business", { scroll: true });
      return;
    }
    router.push("/properties/villas", { scroll: true });
  }, [router, baseVariant]);

  const constrainedBase = baseVariant != null;
  const isVillasBase = baseVariant === "villas";
  const showVillasSpecificBlocks = !constrainedBase || isVillasBase;
  const showSubjectBlock = !constrainedBase;

  const staticSubAreasForMain: SubArea[] =
    filters.mainArea && areas[filters.mainArea as keyof typeof areas]?.subAreas
      ? areas[filters.mainArea as keyof typeof areas].subAreas || []
      : [];
  /** Catalog may pass [] when no listing has `subArea` set — still offer taxonomy sub-areas (e.g. Ubud). */
  const subAreaOptions: SubArea[] =
    allowedSubAreas !== undefined && allowedSubAreas.length > 0
      ? allowedSubAreas
      : staticSubAreasForMain;
  const areaList = getMergedAreaInfos();
  const areasToShow =
    allowedMainAreas !== undefined
      ? areaList.filter((a) => allowedMainAreas.includes(a.id))
      : areaList;

  const getVisibleStepIdsFor = useCallback(
    (f: PropertyFiltersState): WizardStepId[] => {
      const staticSub: SubArea[] =
        f.mainArea && areas[f.mainArea as keyof typeof areas]?.subAreas
          ? areas[f.mainArea as keyof typeof areas].subAreas || []
          : [];
      const order: WizardStepId[] = ["action", "payment", "subject", "area", "subarea", "bedrooms"];
      return order.filter((id) => {
        switch (id) {
          case "action":
            return showVillasSpecificBlocks;
          case "payment":
            return showVillasSpecificBlocks && f.type === "rent";
          case "subject":
            return showSubjectBlock;
          case "area":
            return true;
          case "subarea":
            return staticSub.length > 0;
          case "bedrooms":
            return showVillasSpecificBlocks;
          default:
            return false;
        }
      });
    },
    [showVillasSpecificBlocks, showSubjectBlock]
  );

  const updateURL = useCallback(
    (newFilters: PropertyFiltersState) => {
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

      const qsForPath = (pn: string, omitSubArea?: boolean) => {
        const qp = new URLSearchParams(queryParams.toString());
        if (omitSubArea) qp.delete("subArea");
        const m = pn.match(/^\/properties\/[^/]+\/([^/]+)(?:\/|$)/);
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
    },
    [router]
  );

  const advanceAfterNav = useCallback(
    (newFilters: PropertyFiltersState) => {
      const visible = getVisibleStepIdsFor(newFilters);
      if (visible.length === 0) return;
      setCurrentStepId((prev) => {
        if (prev === "done") return "done";
        const last = visible[visible.length - 1]!;
        if (prev === last) return "done";
        const idx = visible.indexOf(prev as WizardStepId);
        const base = idx === -1 ? 0 : idx;
        return visible[Math.min(base + 1, visible.length - 1)]!;
      });
    },
    [getVisibleStepIdsFor]
  );

  const applyFilterNav = useCallback(
    (newFilters: PropertyFiltersState, advanceWizard = true) => {
      setFilters(newFilters);
      if (advanceWizard) advanceAfterNav(newFilters);
      startTransition(() => {
        updateURL(newFilters);
      });
    },
    [updateURL, advanceAfterNav]
  );

  const visibleStepIds = useMemo(() => getVisibleStepIdsFor(filters), [filters, getVisibleStepIdsFor]);

  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const wasCollapsedRef = useRef(true);
  useEffect(() => {
    if (wasCollapsedRef.current && !isCollapsed) {
      const f = buildFiltersFromSearchParams(searchParams, defaultMainArea, defaultType, pathSubArea, pathname);
      const visible = getVisibleStepIdsFor(f);
      setCurrentStepId(
        suggestedWizardStep(
          f,
          visible,
          showVillasSpecificBlocks,
          showSubjectBlock,
          subAreaPromptSkipped,
          wizardSkipped
        )
      );
    }
    wasCollapsedRef.current = isCollapsed;
  }, [
    isCollapsed,
    searchParams,
    defaultMainArea,
    defaultType,
    pathSubArea,
    pathname,
    getVisibleStepIdsFor,
    showVillasSpecificBlocks,
    showSubjectBlock,
    subAreaPromptSkipped,
    wizardSkipped,
  ]);

  /** When path or ?query changes (not on first open): keep step if still valid, else snap to suggested — avoids resetting to step 1 after Rent/Monthly/Ubud. */
  const prevPathAndQueryForStepRef = useRef<string | null>(null);
  const pathAndQuery = `${pathname}?${searchKey}`;
  useEffect(() => {
    if (isCollapsed) return;
    if (prevPathAndQueryForStepRef.current === null) {
      prevPathAndQueryForStepRef.current = pathAndQuery;
      return;
    }
    if (prevPathAndQueryForStepRef.current === pathAndQuery) return;
    prevPathAndQueryForStepRef.current = pathAndQuery;
    const f = buildFiltersFromSearchParams(searchParams, defaultMainArea, defaultType, pathSubArea, pathname);
    const visible = getVisibleStepIdsFor(f);
    setCurrentStepId((prev) => {
      if (prev === "done") {
        if (!f.type || !f.mainArea) {
          return suggestedWizardStep(
            f,
            visible,
            showVillasSpecificBlocks,
            showSubjectBlock,
            subAreaPromptSkipped,
            wizardSkipped
          );
        }
        return "done";
      }
      if (visible.includes(prev as WizardStepId)) return prev as WizardStepIdOrDone;
      return suggestedWizardStep(
        f,
        visible,
        showVillasSpecificBlocks,
        showSubjectBlock,
        subAreaPromptSkipped,
        wizardSkipped
      );
    });
  }, [
    pathAndQuery,
    pathname,
    searchKey,
    searchParams,
    defaultMainArea,
    defaultType,
    pathSubArea,
    getVisibleStepIdsFor,
    showVillasSpecificBlocks,
    showSubjectBlock,
    subAreaPromptSkipped,
    wizardSkipped,
    isCollapsed,
  ]);

  const handleMainAreaChange = (area: MainArea) => {
    setWizardSkipped((s) => ({ ...s, area: false }));
    applyFilterNav({ ...filters, mainArea: area, subArea: [] }, true);
  };

  const handleSubAreaChange = (subArea: SubArea, checked: boolean) => {
    const newSubAreas = checked
      ? Array.from(new Set([...filters.subArea, subArea])).sort((a, b) =>
          subAreaNames[a].localeCompare(subAreaNames[b])
        )
      : filters.subArea.filter((s) => s !== subArea);
    applyFilterNav({ ...filters, subArea: newSubAreas }, true);
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
    applyFilterNav({ ...filters, bedrooms: newBedrooms }, true);
  };

  const handleFeatureChange = (feature: keyof PropertyFiltersState, checked: boolean) => {
    const newFilters = { ...filters, [feature]: checked };
    setFilters(newFilters);
    startTransition(() => updateURL(newFilters));
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
    setWizardSkipped((s) => ({ ...s, action: false, payment: false, subject: false }));
    const newSubject: Subject =
      newAction === "Rent" ? "Villas" : subject === "Villas" || subject === "Land" || subject === "Business" ? subject : "Villas";
    const newType = typeFromActionSubject(newAction, newSubject);
    const newFilters = {
      ...filters,
      type: newType,
      minDuration: newAction === "Buy" ? undefined : filters.mainArea ? (filters.minDuration ?? 1) : undefined,
    };
    if (filters.mainArea) {
      const a = filters.mainArea;
      setFilters(newFilters);
      advanceAfterNav(newFilters);
      startTransition(() => {
        if (a === "ubud" && filters.subArea.length === 1) {
          router.push(`/properties/${newType}/ubud/${filters.subArea[0]}`, { scroll: false });
        } else {
          router.push(`/properties/${newType}/${a}`, { scroll: false });
        }
      });
    } else {
      applyFilterNav(newFilters, true);
    }
  };

  const handleSubjectChange = (newSubject: Subject) => {
    setWizardSkipped((s) => ({ ...s, subject: false }));
    const effectiveAction = action ?? "Buy";
    const newType = typeFromActionSubject(effectiveAction, newSubject);
    const newFilters = {
      ...filters,
      type: newType,
      minDuration: newType === "rent" ? (filters.mainArea ? (filters.minDuration ?? 1) : undefined) : undefined,
    };
    if (filters.mainArea) {
      const a = filters.mainArea;
      setFilters(newFilters);
      advanceAfterNav(newFilters);
      startTransition(() => {
        if (a === "ubud" && filters.subArea.length === 1) {
          router.push(`/properties/${newType}/ubud/${filters.subArea[0]}`, { scroll: false });
        } else {
          router.push(`/properties/${newType}/${a}`, { scroll: false });
        }
      });
    } else {
      applyFilterNav(newFilters, true);
    }
  };

  const isSubAreaChecked = (s: SubArea) => filters.subArea.includes(s);
  const isBedroomChecked = (b: number) => filters.bedrooms.includes(b);
  const bedroomLabel = (b: number) => (b === 1 ? "1 bed" : `${b} beds`);

  const FEATURES_OPTIONS: { key: keyof PropertyFiltersState; label: string }[] = [
    { key: "hasBathtub", label: "Bathtub" },
    { key: "hasCarPark", label: "Car park" },
    { key: "hasClosedKitchen", label: "Enclosed kitchen" },
    { key: "hasEnclosedLiving", label: "Enclosed living" },
    { key: "hasDesk", label: "Desk" },
    { key: "hasGarage", label: "Garage" },
    { key: "hasHighSpeedWifi", label: "High-speed Wi‑Fi" },
    { key: "hasNatureView", label: "Nature view" },
    { key: "hasPetFriendly", label: "Pet friendly" },
    { key: "hasPool", label: "Pool" },
    { key: "hasWashingMachine", label: "Washing machine" },
  ];
  const visibleFeatureOptions =
    availableAmenityKeys !== undefined
      ? FEATURES_OPTIONS.filter((f) => availableAmenityKeys.includes(f.key as string))
      : FEATURES_OPTIONS;
  const isRent = action === "Rent";

  /** `softAny`: light emerald tint for “Any” — visible cue without looking like a committed choice. */
  const pill = (
    selected: boolean,
    onClick: () => void,
    children: React.ReactNode,
    key?: string,
    softAny = false
  ) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      className={`
        inline-flex min-h-[2.25rem] items-center px-2.5 py-1.5 text-sm font-medium rounded-md border transition-colors duration-150 ease-out
        active:scale-[0.98]
        whitespace-nowrap leading-tight
        ${
          selected
            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm hover:bg-emerald-700"
            : softAny
              ? "bg-emerald-50/95 text-stone-700 border-emerald-200/90 hover:bg-emerald-100/90 hover:border-emerald-300"
              : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:border-stone-300"
        }
      `}
    >
      {children}
    </button>
  );

  type FilterChip = { id: string; label: string; remove: () => void };

  const filterChips: FilterChip[] = (() => {
    const chips: FilterChip[] = [];
    if (filters.type === "rent")
      chips.push({
        id: "t-rent",
        label: "Rent",
        remove: () => applyFilterNav({ ...filters, type: undefined, minDuration: undefined }, false),
      });
    else if (filters.type === "sale")
      chips.push({
        id: "t-sale",
        label: "Buy · villas",
        remove: () => applyFilterNav({ ...filters, type: undefined, minDuration: undefined }, false),
      });
    else if (filters.type === "land")
      chips.push({
        id: "t-land",
        label: "Land",
        remove: () => applyFilterNav({ ...filters, type: undefined, minDuration: undefined }, false),
      });
    else if (filters.type === "business")
      chips.push({
        id: "t-bus",
        label: "Business",
        remove: () => applyFilterNav({ ...filters, type: undefined, minDuration: undefined }, false),
      });

    if (filters.type === "rent") {
      if (filters.minDuration === 1)
        chips.push({
          id: "pay-m",
          label: "Monthly",
          remove: () => applyFilterNav({ ...filters, minDuration: undefined }, false),
        });
      else if (filters.minDuration === 12)
        chips.push({
          id: "pay-y",
          label: "Yearly",
          remove: () => applyFilterNav({ ...filters, minDuration: undefined }, false),
        });
    }

    if (filters.mainArea) {
      const nm = areas[filters.mainArea]?.nameEn ?? filters.mainArea;
      chips.push({
        id: `area-${filters.mainArea}`,
        label: nm,
        remove: () => applyFilterNav({ ...filters, mainArea: undefined, subArea: [] }, false),
      });
    }
    filters.subArea.forEach((s) => {
      chips.push({
        id: `sub-${s}`,
        label: subAreaNames[s] ?? s,
        remove: () => applyFilterNav({ ...filters, subArea: filters.subArea.filter((x) => x !== s) }, false),
      });
    });
    filters.bedrooms.forEach((b) => {
      chips.push({
        id: `bed-${b}`,
        label: bedroomLabel(b),
        remove: () => applyFilterNav({ ...filters, bedrooms: filters.bedrooms.filter((x) => x !== b) }, false),
      });
    });
    if (filters.maxPrice) {
      chips.push({
        id: "maxp",
        label: "Max price",
        remove: () => applyFilterNav({ ...filters, maxPrice: undefined }, false),
      });
    }
    FEATURES_OPTIONS.forEach(({ key, label }) => {
      if (filters[key]) {
        chips.push({
          id: String(key),
          label,
          remove: () => {
            const nf = { ...filters, [key]: false };
            setFilters(nf);
            startTransition(() => updateURL(nf));
          },
        });
      }
    });
    return chips;
  })();

  /** Matches visible chips (path + query), not raw query param count — avoids “1 active” when type/area live in the URL. */
  const activeSelectionCount = filterChips.length;

  const collapsedBase = "Show filters";
  const countLabel =
    matchingCount === 1 ? "Found 1 property" : `Found ${matchingCount} properties`;

  const safeStepId: WizardStepIdOrDone =
    currentStepId === "done"
      ? "done"
      : visibleStepIds.includes(currentStepId as WizardStepId)
        ? (currentStepId as WizardStepId)
        : (visibleStepIds[0] ?? "area");

  const stepHeading = (() => {
    switch (safeStepId) {
      case "action":
        return "Rent or Buy";
      case "payment":
        return "Payment";
      case "subject":
        return "Property Type";
      case "area":
        return "Area";
      case "subarea":
        return "Sub-area";
      case "bedrooms":
        return "Bedrooms";
      case "done":
        return "Overview";
      default:
        return "";
    }
  })();

  const stepIndexLabel =
    safeStepId === "done"
      ? ""
      : visibleStepIds.length > 0
        ? `Step ${visibleStepIds.indexOf(safeStepId as WizardStepId) + 1} / ${visibleStepIds.length}`
        : "";

  return (
    <div className="mb-1.5 mx-auto w-full max-w-3xl rounded-lg border border-stone-200 bg-white px-2.5 py-2 shadow-sm text-sm text-stone-700">
      {isCollapsed ? (
        <button
          type="button"
          onClick={openFilters}
          className="w-full min-h-[2.25rem] rounded-md border border-emerald-200/90 bg-btn-hatch-emerald px-2.5 py-2 text-left text-sm font-medium text-stone-800 transition-[transform,border-color,background-color] duration-200 hover:border-emerald-300 active:scale-[0.99] flex items-center justify-between"
          aria-expanded={false}
        >
          <span>{collapsedBase}</span>
          <span className="font-normal text-stone-500">
            {activeSelectionCount > 0
              ? `${activeSelectionCount} ${activeSelectionCount === 1 ? "filter" : "filters"} active`
              : "Tap to open"}
          </span>
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={closeFilters}
            className="w-full min-h-[2.25rem] rounded-md border border-stone-200 px-2.5 py-2 text-left text-sm font-medium text-stone-800 hover:border-stone-300 hover:bg-stone-50/80 active:scale-[0.99] transition-[transform,border-color,background-color] duration-200 bg-btn-hatch flex items-center justify-between"
            aria-expanded={true}
          >
            <span>Hide filters</span>
            <span className="font-normal text-stone-500">Tap to close</span>
          </button>

          {/* Wizard first: avoids pushing steps down when chips appear; summary strip below has fixed min height */}
          <div className="relative rounded-md border border-stone-200 bg-stone-50/60 px-2.5 py-2">
            {visibleStepIds.length > 0 && (
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 pb-2">
                <p className="text-sm font-semibold text-stone-800">{stepHeading}</p>
                {stepIndexLabel ? (
                  <span className="text-sm font-normal tabular-nums text-stone-500">{stepIndexLabel}</span>
                ) : null}
              </div>
            )}
            {isPending ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-white/80 backdrop-blur-[1px]">
                <Spinner />
              </div>
            ) : null}

            <div className={isPending ? "pointer-events-none opacity-45" : ""}>
              {safeStepId === "done" && (
                <p className="text-sm text-stone-600 leading-relaxed">
                  Main filters are set. Change them with the chips below, adjust amenities if you like, then{" "}
                  <span className="font-medium text-stone-700">hide filters and view listings</span>.
                </p>
              )}

              {safeStepId === "action" && showVillasSpecificBlocks && (
                <section aria-label={stepHeading}>
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 md:flex-wrap scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent">
                    {pill(
                      false,
                      () => {
                        setWizardSkipped((s) => ({ ...s, action: true, payment: true, subject: true }));
                        applyFilterNav({ ...filters, type: undefined, minDuration: undefined }, true);
                      },
                      "Any",
                      undefined,
                      true
                    )}
                    {(["Rent", "Buy"] as const).map((a) =>
                      pill(action === a, () => handleActionChange(a), a, `action-${a}`)
                    )}
                  </div>
                </section>
              )}

              {safeStepId === "payment" && showVillasSpecificBlocks && isRent && (
                <section aria-label={stepHeading}>
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 md:flex-wrap">
                    {pill(false, () => {
                      setWizardSkipped((s) => ({ ...s, payment: true }));
                      applyFilterNav({ ...filters, minDuration: undefined }, true);
                    }, "Any", undefined, true)}
                    {pill(filters.minDuration === 1, () => {
                      setWizardSkipped((s) => ({ ...s, payment: false }));
                      applyFilterNav({ ...filters, minDuration: 1 }, true);
                    }, "Monthly")}
                    {pill(filters.minDuration === 12, () => {
                      setWizardSkipped((s) => ({ ...s, payment: false }));
                      applyFilterNav({ ...filters, minDuration: 12 }, true);
                    }, "Yearly")}
                  </div>
                </section>
              )}

              {safeStepId === "subject" && showSubjectBlock && (
                <section aria-label={stepHeading}>
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 md:flex-wrap">
                    {pill(false, () => {
                      setWizardSkipped((s) => ({ ...s, subject: true }));
                      applyFilterNav({ ...filters, type: undefined }, true);
                    }, "All types")}
                    {subjectOptions.map((s) => pill(subject === s, () => handleSubjectChange(s), s, `subject-${s}`))}
                  </div>
                </section>
              )}

              {safeStepId === "area" && (
                <section aria-label={stepHeading}>
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 md:flex-wrap scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent">
                    {pill(false, () => {
                      setWizardSkipped((s) => ({ ...s, area: true }));
                      applyFilterNav({ ...filters, mainArea: undefined, subArea: [] }, true);
                    }, "Any", undefined, true)}
                    {areasToShow.map((area) =>
                      pill(
                        filters.mainArea === area.id,
                        () => handleMainAreaChange(area.id),
                        area.nameEn,
                        `area-${area.id}`
                      )
                    )}
                  </div>
                </section>
              )}

              {safeStepId === "subarea" && subAreaOptions.length > 0 && (
                <section aria-label={stepHeading}>
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 md:flex-wrap">
                    {pill(false, () => {
                      setSubAreaPromptSkipped(true);
                      applyFilterNav({ ...filters, subArea: [] }, true);
                    }, "Any", "sub-any", true)}
                    {subAreaOptions.map((subArea) =>
                      pill(
                        isSubAreaChecked(subArea),
                        () => handleSubAreaChange(subArea, !isSubAreaChecked(subArea)),
                        subAreaNames[subArea],
                        `subarea-${subArea}`
                      )
                    )}
                  </div>
                </section>
              )}

              {safeStepId === "bedrooms" && showVillasSpecificBlocks && (
                <section aria-label={stepHeading}>
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 md:flex-wrap">
                    {pill(
                      false,
                      () => {
                        setWizardSkipped((s) => ({ ...s, bedrooms: true }));
                        applyFilterNav({ ...filters, bedrooms: [] }, true);
                      },
                      "Any",
                      "beds-any",
                      true
                    )}
                    {bedroomOptions.map((beds) =>
                      pill(
                        isBedroomChecked(beds),
                        () => {
                          setWizardSkipped((s) => ({ ...s, bedrooms: false }));
                          handleBedroomChange(beds, !isBedroomChecked(beds));
                        },
                        bedroomLabel(beds),
                        `beds-${beds}`
                      )
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* Reserved height: count + chip row so the panel does not jump when the first chip appears */}
          <div
            className="rounded-md border border-dashed border-stone-200/90 bg-stone-50/30 px-2.5 py-2 min-h-[4.25rem]"
            role="region"
            aria-label="Active filters summary"
          >
            <p className="text-sm font-medium text-stone-500 leading-tight mb-1.5" role="status" aria-live="polite">
              {countLabel}
            </p>
            <div className="min-h-[2.25rem] flex flex-wrap items-center gap-2">
              {filterChips.length === 0 ? (
                <span className="text-sm text-stone-500 leading-snug max-w-[22rem]">
                  No selections yet — use the steps above.
                </span>
              ) : (
                filterChips.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex max-w-full items-stretch overflow-hidden rounded-full border border-stone-200 bg-white text-sm font-medium text-stone-800 shadow-sm"
                  >
                    <span className="flex min-w-0 max-w-[14rem] items-center truncate px-3 py-1.5 sm:max-w-[18rem]">
                      {c.label}
                    </span>
                    <button
                      type="button"
                      className="flex items-center border-l border-stone-200 bg-stone-50/90 px-2.5 py-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                      aria-label={`Remove ${c.label}`}
                      onClick={() => c.remove()}
                    >
                      <span className="text-base font-light leading-none" aria-hidden>
                        ×
                      </span>
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {showVillasSpecificBlocks && visibleFeatureOptions.length > 0 && (
            <section className="border-t border-stone-200 pt-2">
              <p className="text-sm font-semibold text-stone-800 mb-1.5">Amenities</p>
              <div className="divide-y divide-stone-100 rounded-md border border-stone-200 bg-white px-2.5 py-2">
                {visibleFeatureOptions.map(({ key, label }) => (
                  <ToggleSwitch
                    key={key}
                    id={`filter-${String(key)}`}
                    label={label}
                    checked={!!filters[key]}
                    onChange={(checked) => handleFeatureChange(key, checked)}
                    compact
                  />
                ))}
              </div>
            </section>
          )}

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={clearFilters}
              className="w-full min-h-[2.25rem] rounded-md border border-red-200/90 bg-red-50/95 px-2.5 py-2 text-center text-sm font-normal text-stone-700 hover:bg-red-100/90 hover:border-red-300/90 active:scale-[0.99] transition-colors duration-150"
            >
              Clear filters
            </button>
            <button
              type="button"
              onClick={hideFiltersAndViewListings}
              className="w-full min-h-[2.25rem] rounded-md border border-emerald-200/90 bg-btn-hatch-emerald px-2.5 py-2 text-center text-sm font-medium text-stone-800 transition-[transform,border-color,background-color] duration-200 hover:border-emerald-300 active:scale-[0.99]"
            >
              {"Hide filters & view listings"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
