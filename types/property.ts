import type { FeatureTriState, PropertyFeatureKey } from "@/lib/featureState";

export type PropertyType = 'rent' | 'sale' | 'land' | 'business';

export type { FeatureTriState, PropertyFeatureKey };

/** Tri-state in admin; legacy `boolean` may still exist in old `data/properties.ts` until re-saved */
export type FeatureValue = FeatureTriState | boolean;

/** Omitted keys = treat as unknown after normalization */
export type PropertyFeatures = Partial<Record<PropertyFeatureKey, FeatureValue>>;

export type SubArea =
  | 'gentong'
  | 'kedewatan'
  | 'keliki'
  | 'kemenuh'
  | 'lodtunduh'
  | 'mas'
  | 'penestanan'
  | 'petulu'
  | 'sayan'
  | 'sukawati'
  | 'tegallalang';
/** Built-in slugs + any extra slug from `data/catalog-structure.json` (admin-managed). */
export type MainArea =
  | "ubud"
  | "canggu"
  | "sanur"
  | "seminyak"
  | "tanah-lot"
  | "kerobokan"
  | (string & {});

export interface Property {
  id: string;
  /** Optional. If empty, site shows auto-generated title from villaNumber + bedrooms + subArea. */
  title?: string;
  /** Villa number (e.g. "50") — used in auto-title like "Villa #50 · 2 bed · Lodtunduh". */
  villaNumber?: string;
  /** Internal name — shown only in admin, never on the public site. */
  internalName?: string;
  description?: string;
  types: PropertyType[]; // Property can be available for multiple types (rent AND sale)
  mainArea: MainArea; // Main area (ubud, canggu, sanur)
  /** Sub-area/neighborhood. Optional when main area has no sub-areas (e.g. Seminyak). */
  subArea?: SubArea;
  /** Google Maps or other link — admin only, not shown on site. */
  exactLocation?: string;
  /** Latitude,longitude for map (e.g. "-8.5068,115.2624"). Optional. */
  displayLocation?: string;
  bedrooms: number;
  bathrooms?: number;
  price: {
    currency: 'IDR' | 'USD';
    /** Legacy / fallback: single price (e.g. for sale). For rent, prefer monthly + yearly. */
    min?: number;
    /** Monthly price (rent). When set with yearly, discount % is shown. */
    monthly?: number;
    /** Yearly price (rent). When set with monthly, discount % is calculated. */
    yearly?: number;
    /** Price for sale (full payment). Shown when types includes 'sale'. */
    forSale?: number;
  };
  duration?: {
    min: number; // months
    max?: number;
  };
  /** Per amenity: yes / no / unknown (owner not asked yet). Filters only match `yes`. Legacy booleans OK. */
  features: PropertyFeatures;
  images: string[];
  order?: number; // For sorting - lower number = appears first
  /** When true, hidden from catalog and admin main list; direct URL still works; show "not available" + notify form */
  archived?: boolean;
  /** When set (ISO date YYYY-MM-DD), villa is available from this date. When null/undefined = available now. */
  availableFrom?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PropertyFilters {
  mainArea?: MainArea[];
  subArea?: SubArea[];
  bedrooms?: number[];
  type?: PropertyType[];
  hasBathtub?: boolean;
  hasCarPark?: boolean;
  hasClosedKitchen?: boolean;
  hasDesk?: boolean;
  hasEnclosedLiving?: boolean;
  hasGarage?: boolean;
  hasHighSpeedWifi?: boolean;
  hasNatureView?: boolean;
  hasPetFriendly?: boolean;
  hasPool?: boolean;
  hasWashingMachine?: boolean;
  minDuration?: number;
  maxPrice?: number;
}
