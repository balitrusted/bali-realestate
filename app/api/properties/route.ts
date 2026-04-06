import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Property, PropertyType } from "@/types/property";

const ALL_PROPERTY_TYPES: PropertyType[] = ["rent", "sale", "land", "business"];

/** Dedupe, keep only valid flags; default rent when empty. */
function normalizeTypesInput(input: unknown): PropertyType[] {
  if (!Array.isArray(input)) return ["rent"];
  const seen = new Set<PropertyType>();
  const out: PropertyType[] = [];
  for (const x of input) {
    if (typeof x !== "string") continue;
    const t = x as PropertyType;
    if (!ALL_PROPERTY_TYPES.includes(t) || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out.length > 0 ? out : ["rent"];
}
import { normalizePropertyFeatures } from "@/lib/featureState";
import { buildPropertySlugIndex } from "@/lib/propertySlug";
import { loadFullPropertyList, persistPropertyList } from "@/lib/propertiesStorage";
import { normalizeVillaNumberKey } from "@/lib/propertyUtils";
import { isValidMainAreaSlug } from "@/lib/mainAreaRegistry";

/** Admin and catalog must never serve stale JSON from edge/browser caches. */
export const dynamic = "force-dynamic";

function apiJson(data: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set(
    "Cache-Control",
    "private, no-store, no-cache, must-revalidate, max-age=0"
  );
  return NextResponse.json(data, { ...init, headers });
}

function isLandOnlyTypes(types: PropertyType[]): boolean {
  return (
    types.includes("land") &&
    !types.some((t) => t === "rent" || t === "sale" || t === "business")
  );
}

function findVillaNumberConflict(
  properties: Property[],
  key: string,
  excludeId?: string
): Property | undefined {
  if (!key) return undefined;
  return properties.find(
    (p) =>
      p.id !== excludeId && normalizeVillaNumberKey(p.villaNumber) === key
  );
}

function hasValidPrice(p: Property): boolean {
  return !!(
    p?.price &&
    (typeof p.price.min === "number" ||
      typeof p.price.monthly === "number" ||
      typeof p.price.yearly === "number" ||
      typeof p.price.forSale === "number")
  );
}

/** Main + archive lists with slugs from an in-memory full list (avoids stale Blob reads after persist). */
function buildListsWithSlugs(fullList: Property[]): {
  properties: Array<Property & { publicSlug: string }>;
  archivedProperties: Array<Property & { publicSlug: string }>;
} {
  const valid = fullList.filter((p) => p && p.id && hasValidPrice(p));
  const slugIdx = buildPropertySlugIndex(valid);
  const sortFn = (a: Property, b: Property) =>
    (a.order ?? 999) - (b.order ?? 999);
  const main = valid
    .filter((p) => p.archived !== true)
    .sort(sortFn)
    .map((p) => ({ ...p, publicSlug: slugIdx.segmentFor(p) }));
  const archived = valid
    .filter((p) => p.archived === true)
    .sort(sortFn)
    .map((p) => ({ ...p, publicSlug: slugIdx.segmentFor(p) }));
  return { properties: main, archivedProperties: archived };
}

function getPropertiesForRequest(
  fullList: Property[],
  searchParams: URLSearchParams
): { properties: Array<Property & { publicSlug: string }> } {
  const archiveFilter = searchParams.get("archived");
  const idsParam = searchParams.get("ids");

  let validProperties = fullList.filter((p) => p && p.id && hasValidPrice(p));

  if (archiveFilter === "true") {
    validProperties = validProperties.filter((p) => p.archived === true);
  } else if (archiveFilter === "false" || !archiveFilter) {
    validProperties = validProperties.filter((p) => p.archived !== true);
  }

  if (idsParam?.trim()) {
    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
    const idSet = new Set(ids);
    validProperties = validProperties.filter(
      (p) => p.id != null && idSet.has(String(p.id))
    );
  }

  const sorted = [...validProperties].sort(
    (a, b) => (a.order ?? 999) - (b.order ?? 999)
  );

  const allForSlugs = fullList.filter((p) => p && p.id && hasValidPrice(p));
  const slugIdx = buildPropertySlugIndex(allForSlugs);
  const withSlugs = sorted.map((p) => ({
    ...p,
    publicSlug: slugIdx.segmentFor(p),
  }));

  return { properties: withSlugs };
}

// Check authentication
async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin-auth")?.value === "true";
}

// GET - Get all properties (optional ?archived=true for archive list only)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fullList = await loadFullPropertyList();
    return apiJson(getPropertiesForRequest(fullList, searchParams));
  } catch (error) {
    console.error("Error reading properties:", error);
    return apiJson(
      { error: "Failed to read properties", properties: [] },
      { status: 500 }
    );
  }
}

// POST - Create new property
export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return apiJson({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const property: any = await request.json();
    
    // Read current properties
    const properties = await loadFullPropertyList();

    const types: PropertyType[] = normalizeTypesInput(
      property.types !== undefined
        ? property.types
        : property.type !== undefined
          ? [property.type]
          : ["rent"]
    );
    const landOnly = isLandOnlyTypes(types);

    // Validate property data
    if (!property.villaNumber?.trim()) {
      return apiJson(
        { error: "Missing required fields: villaNumber" },
        { status: 400 }
      );
    }
    if (!landOnly && (!property.bedrooms || property.bedrooms < 1)) {
      return apiJson(
        { error: "Missing required fields: bedrooms" },
        { status: 400 }
      );
    }

    const villaKey = normalizeVillaNumberKey(property.villaNumber);
    const duplicate = findVillaNumberConflict(properties, villaKey);
    if (duplicate) {
      return apiJson(
        {
          error:
            "This villa number is already used by another listing. Choose a different number.",
        },
        { status: 409 }
      );
    }

    // Ensure price structure (monthly/yearly, forSale, or min)
    const hasAnyPrice = property.price && (
      typeof property.price.min === 'number' ||
      typeof property.price.monthly === 'number' ||
      typeof property.price.forSale === 'number'
    );
    if (!hasAnyPrice) {
      property.price = {
        currency: property.priceCurrency || "IDR",
        min: property.price?.min ?? property.price?.monthly ?? property.priceForSale ?? property.priceMin ?? 0,
        monthly: property.price?.monthly,
        yearly: property.price?.yearly,
        forSale: property.price?.forSale ?? property.priceForSale,
      };
    }

    // Ensure mainArea
    const mainArea = property.mainArea || "ubud";
    if (!isValidMainAreaSlug(mainArea)) {
      return apiJson(
        { error: "Invalid or unknown main area. Add the area in Admin → Catalog structure, or use a built-in slug." },
        { status: 400 }
      );
    }

    // Add new property
    const newProperty: Property = {
      id: property.id || `prop-${Date.now()}`,
      title: property.title?.trim() || undefined,
      villaNumber: property.villaNumber?.trim() || undefined,
      internalName: property.internalName?.trim() || undefined,
      description: property.description || "",
      types: types,
      mainArea: mainArea,
      ...(property.subArea != null && { subArea: property.subArea }),
      exactLocation: property.exactLocation?.trim() || undefined,
      displayLocation: property.displayLocation?.trim() || undefined,
      bedrooms: landOnly ? 0 : property.bedrooms,
      bathrooms: landOnly ? undefined : property.bathrooms,
      price: property.price,
      duration: property.duration,
      features: normalizePropertyFeatures(property.features),
      images: Array.isArray(property.images) ? property.images : [],
      order: property.order ?? properties.length,
      archived: property.archived === true,
      availableFrom: property.availableFrom ?? undefined,
      createdAt: property.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    properties.push(newProperty);

    await persistPropertyList(properties);

    return apiJson({
      property: newProperty,
      ...buildListsWithSlugs(properties),
    });
  } catch (error) {
    console.error("Error creating property:", error);
    return apiJson(
      { error: "Failed to create property" },
      { status: 500 }
    );
  }
}

// PUT - Update property or reorder
export async function PUT(request: Request) {
  if (!(await checkAuth())) {
    return apiJson({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, property, newOrder } = await request.json();

    let properties = await loadFullPropertyList();

    if (action === "reorder") {
      // Reorder properties
      properties = newOrder.map((id: string, index: number) => {
        const prop = properties.find((p) => p.id === id);
        return prop ? { ...prop, order: index, updatedAt: new Date().toISOString() } : null;
      }).filter(Boolean) as Property[];
    } else if (action === "update" && property) {
      // Update single property
      const index = properties.findIndex((p) => p.id === property.id);
      if (index === -1) {
        return apiJson(
          { error: `Property not found in data file: ${String(property.id)}` },
          { status: 404 }
        );
      }

      const merged = { ...properties[index], ...property } as Property;
      const nextVillaKey = normalizeVillaNumberKey(merged.villaNumber);
      if (nextVillaKey) {
        const duplicate = findVillaNumberConflict(
          properties,
          nextVillaKey,
          String(merged.id)
        );
        if (duplicate) {
          return apiJson(
            {
              error:
                "This villa number is already used by another listing. Choose a different number.",
            },
            { status: 409 }
          );
        }
      }

      // Ensure price structure (supports min/max or monthly/yearly)
      const hasAnyPrice = property.price && (
        typeof property.price.min === 'number' ||
        typeof property.price.monthly === 'number' ||
        typeof property.price.forSale === 'number'
      );
      if (!hasAnyPrice) {
        property.price = {
          currency: property.priceCurrency || properties[index].price?.currency || "IDR",
          min: property.price?.min ?? property.price?.monthly ?? property.price?.forSale ?? property.priceMin ?? properties[index].price?.min ?? 0,
          monthly: property.price?.monthly ?? properties[index].price?.monthly,
          yearly: property.price?.yearly ?? properties[index].price?.yearly,
          forSale: property.price?.forSale ?? properties[index].price?.forSale ?? property.priceForSale,
        };
      }

      const types: PropertyType[] = normalizeTypesInput(
        property.types !== undefined ? property.types : properties[index].types
      );
      const landOnly = isLandOnlyTypes(types);

      // Ensure mainArea; subArea is optional and can be cleared (null/undefined) for non-Ubud areas
      const mainArea = property.mainArea || properties[index].mainArea || "ubud";
      if (!isValidMainAreaSlug(mainArea)) {
        return apiJson(
          {
            error:
              "Invalid or unknown main area. Add the area in Admin → Catalog structure, or use a built-in slug.",
          },
          { status: 400 }
        );
      }
      const subArea = property.hasOwnProperty("subArea")
        ? property.subArea || undefined
        : properties[index].subArea;

      const nextBedrooms = landOnly
        ? 0
        : property.bedrooms !== undefined
          ? property.bedrooms
          : properties[index].bedrooms;
      const nextBathrooms = landOnly
        ? undefined
        : property.bathrooms !== undefined
          ? property.bathrooms
          : properties[index].bathrooms;

      properties[index] = {
        ...properties[index],
        ...property,
        types: types,
        mainArea: mainArea,
        subArea: subArea,
        bedrooms: nextBedrooms,
        bathrooms: nextBathrooms,
        price: property.price,
        features: normalizePropertyFeatures(
          property.features ?? properties[index].features
        ),
        updatedAt: new Date().toISOString(),
      };
    }

    await persistPropertyList(properties);

    return apiJson({
      success: true,
      ...buildListsWithSlugs(properties),
    });
  } catch (error) {
    console.error("Error updating properties:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update properties";
    return apiJson({ error: message }, { status: 500 });
  }
}

// DELETE - Delete property
export async function DELETE(request: Request) {
  if (!(await checkAuth())) {
    return apiJson({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return apiJson({ error: "ID required" }, { status: 400 });
    }

    let properties = await loadFullPropertyList();

    properties = properties.filter((p) => p.id !== id);

    await persistPropertyList(properties);

    return apiJson({
      success: true,
      ...buildListsWithSlugs(properties),
    });
  } catch (error) {
    console.error("Error deleting property:", error);
    return apiJson(
      { error: "Failed to delete property" },
      { status: 500 }
    );
  }
}
