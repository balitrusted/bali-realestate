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

// Check authentication
async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin-auth")?.value === "true";
}

// GET - Get all properties (optional ?archived=true for archive list only)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const archiveFilter = searchParams.get("archived"); // "true" | "false" | null (all for admin)
    const idsParam = searchParams.get("ids"); // "1,2,3" for saved/compare lists

    const properties = await loadFullPropertyList();

    // Validate and filter properties
    let validProperties = properties.filter((p) => {
      const hasPrice = p?.price && (
        typeof p.price.min === 'number' ||
        typeof p.price.monthly === 'number' ||
        typeof p.price.yearly === 'number' ||
        typeof p.price.forSale === 'number'
      );
      return p && p.id && hasPrice;
    });

    if (archiveFilter === "true") {
      validProperties = validProperties.filter((p) => p.archived === true);
    } else if (archiveFilter === "false" || !archiveFilter) {
      validProperties = validProperties.filter((p) => p.archived !== true);
    }

    if (idsParam?.trim()) {
      const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
      const idSet = new Set(ids);
      validProperties = validProperties.filter((p) => p.id != null && idSet.has(String(p.id)));
    }

    // Sort by order field
    const sorted = [...validProperties].sort((a, b) => {
      const orderA = a.order ?? 999;
      const orderB = b.order ?? 999;
      return orderA - orderB;
    });

    const allForSlugs = properties.filter((p) => {
      const hasPrice = p?.price && (
        typeof p.price.min === "number" ||
        typeof p.price.monthly === "number" ||
        typeof p.price.yearly === "number" ||
        typeof p.price.forSale === "number"
      );
      return p && p.id && hasPrice;
    });
    const slugIdx = buildPropertySlugIndex(allForSlugs);
    const withSlugs = sorted.map((p) => ({
      ...p,
      publicSlug: slugIdx.segmentFor(p),
    }));

    return NextResponse.json({ properties: withSlugs });
  } catch (error) {
    console.error("Error reading properties:", error);
    return NextResponse.json(
      { error: "Failed to read properties", properties: [] },
      { status: 500 }
    );
  }
}

// POST - Create new property
export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const property: any = await request.json();
    
    // Read current properties
    const properties = await loadFullPropertyList();

    // Validate property data
    if (!property.villaNumber?.trim() || !property.bedrooms) {
      return NextResponse.json(
        { error: "Missing required fields: villaNumber, bedrooms" },
        { status: 400 }
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

    const types: PropertyType[] = normalizeTypesInput(
      property.types !== undefined
        ? property.types
        : property.type !== undefined
          ? [property.type]
          : ["rent"]
    );

    // Ensure mainArea
    const mainArea = property.mainArea || 'ubud';

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
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
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

    return NextResponse.json({ property: newProperty });
  } catch (error) {
    console.error("Error creating property:", error);
    return NextResponse.json(
      { error: "Failed to create property" },
      { status: 500 }
    );
  }
}

// PUT - Update property or reorder
export async function PUT(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        return NextResponse.json(
          { error: `Property not found in data file: ${String(property.id)}` },
          { status: 404 }
        );
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

      // Ensure mainArea; subArea is optional and can be cleared (null/undefined) for non-Ubud areas
      const mainArea = property.mainArea || properties[index].mainArea || 'ubud';
      const subArea = property.hasOwnProperty('subArea') ? (property.subArea || undefined) : properties[index].subArea;

      properties[index] = {
        ...properties[index],
        ...property,
        types: types,
        mainArea: mainArea,
        subArea: subArea,
        price: property.price,
        features: normalizePropertyFeatures(
          property.features ?? properties[index].features
        ),
        updatedAt: new Date().toISOString(),
      };
    }

    await persistPropertyList(properties);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating properties:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update properties";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE - Delete property
export async function DELETE(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    let properties = await loadFullPropertyList();

    properties = properties.filter((p) => p.id !== id);

    await persistPropertyList(properties);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting property:", error);
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 }
    );
  }
}
