import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { areas } from "@/types/areas";
import { SEGMENT_TYPES } from "@/lib/propertiesCatalog";
import type { MainArea } from "@/types/property";

export interface CatalogTypeItem {
  slug: string;
  labelEn: string;
}

export interface CatalogAreaItem {
  slug: string;
  nameEn: string;
}

export interface CatalogStructure {
  types: CatalogTypeItem[];
  areas: CatalogAreaItem[];
  segmentCategories: {
    subArea: string[];
    bedroom: string[];
    payment: string[];
    amenity: string[];
  };
}

const DEFAULT_STRUCTURE: CatalogStructure = {
  types: [
    { slug: "rent", labelEn: "Rent" },
    { slug: "sale", labelEn: "Buy" },
    { slug: "villas", labelEn: "Villas (Rent or Buy)" },
    { slug: "land", labelEn: "Land" },
    { slug: "business", labelEn: "Business" },
    { slug: "hotels", labelEn: "Retreat Hotels" },
  ],
  areas: (Object.keys(areas) as MainArea[]).map((id) => ({
    slug: id,
    nameEn: areas[id].nameEn,
  })),
  segmentCategories: {
    subArea: SEGMENT_TYPES.subArea.slice(),
    bedroom: SEGMENT_TYPES.bedroom.slice(),
    payment: SEGMENT_TYPES.payment.slice(),
    amenity: SEGMENT_TYPES.amenity.slice(),
  },
};

const CATALOG_STRUCTURE_PATH = join(process.cwd(), "data", "catalog-structure.json");

export async function loadCatalogStructure(): Promise<CatalogStructure> {
  try {
    const raw = await readFile(CATALOG_STRUCTURE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as CatalogStructure;
    if (
      Array.isArray(parsed.types) &&
      Array.isArray(parsed.areas) &&
      parsed.segmentCategories &&
      typeof parsed.segmentCategories === "object"
    ) {
      return {
        types: parsed.types,
        areas: parsed.areas,
        segmentCategories: {
          subArea: Array.isArray(parsed.segmentCategories.subArea) ? parsed.segmentCategories.subArea : DEFAULT_STRUCTURE.segmentCategories.subArea,
          bedroom: Array.isArray(parsed.segmentCategories.bedroom) ? parsed.segmentCategories.bedroom : DEFAULT_STRUCTURE.segmentCategories.bedroom,
          payment: Array.isArray(parsed.segmentCategories.payment) ? parsed.segmentCategories.payment : DEFAULT_STRUCTURE.segmentCategories.payment,
          amenity: Array.isArray(parsed.segmentCategories.amenity) ? parsed.segmentCategories.amenity : DEFAULT_STRUCTURE.segmentCategories.amenity,
        },
      };
    }
  } catch {
    // file missing or invalid
  }
  return DEFAULT_STRUCTURE;
}

export async function saveCatalogStructure(structure: CatalogStructure): Promise<void> {
  await writeFile(CATALOG_STRUCTURE_PATH, JSON.stringify(structure, null, 2), "utf-8");
}
