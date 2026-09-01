import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Property, PropertyType } from "@/types/property";

const ALL_PROPERTY_TYPES: PropertyType[] = ["rent", "sale", "land", "business", "hotels"];

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
import {
  loadFullPropertyList,
  normalizePropertyListForPersistence,
  persistPropertyList,
  runExclusiveCatalogWrite,
  withNormalizedCatalogFeatures,
} from "@/lib/propertiesStorage";
import { normalizeVillaNumberKey } from "@/lib/propertyUtils";
import { isValidMainAreaSlug } from "@/lib/mainAreaRegistry";
import {
  MutationHttpError,
  stableArraySignature,
  writeBlobJsonArrayWithRetry,
} from "@/lib/blobJsonOptimisticWrite";
import {
  normalizeAvailableFrom,
  propertyWithNormalizedAvailability,
} from "@/lib/availability";
import { diffPropertyFields } from "@/lib/propertyChangeDiff";
import { safeAppendPropertyEvent } from "@/lib/propertyEvents";

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

/** `persistPropertyList` normalizes via TS round-trip; compare that shape after read. */
async function verifyPropertyCatalogWrite(written: Property[]): Promise<boolean> {
  const after = await loadFullPropertyList();
  const expected = withNormalizedCatalogFeatures(
    normalizePropertyListForPersistence(written)
  );
  return stableArraySignature(after) === stableArraySignature(expected);
}

/**
 * Strict verification is expensive for large catalogs on Blob.
 * Keep it opt-in while we complete DB migration.
 */
const useStrictCatalogWriteVerification =
  process.env.PROPERTIES_STRICT_VERIFY === "1";

const fastCatalogWriteVerify = async () => true;

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

function updateSingleProperty(
  properties: Property[],
  property: any
): Property[] {
  const index = properties.findIndex((p) => p.id === property.id);
  if (index === -1) {
    throw new MutationHttpError(
      apiJson(
        { error: `Property not found in data file: ${String(property.id)}` },
        { status: 404 }
      )
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
      throw new MutationHttpError(
        apiJson(
          {
            error:
              "This villa number is already used by another listing. Choose a different number.",
          },
          { status: 409 }
        )
      );
    }
  }

  const hasAnyPrice =
    property.price &&
    (typeof property.price.min === "number" ||
      typeof property.price.monthly === "number" ||
      typeof property.price.forSale === "number");
  if (!hasAnyPrice) {
    property.price = {
      currency: property.priceCurrency || properties[index].price?.currency || "IDR",
      min:
        property.price?.min ??
        property.price?.monthly ??
        property.price?.forSale ??
        property.priceMin ??
        properties[index].price?.min ??
        0,
      monthly: property.price?.monthly ?? properties[index].price?.monthly,
      yearly: property.price?.yearly ?? properties[index].price?.yearly,
      forSale:
        property.price?.forSale ??
        properties[index].price?.forSale ??
        property.priceForSale,
    };
  }

  const types: PropertyType[] = normalizeTypesInput(
    property.types !== undefined ? property.types : properties[index].types
  );
  const landOnly = isLandOnlyTypes(types);

  const mainArea = property.mainArea || properties[index].mainArea || "ubud";
  if (!isValidMainAreaSlug(mainArea)) {
    throw new MutationHttpError(
      apiJson(
        {
          error:
            "Invalid or unknown main area. Add the area in Admin → Catalog structure, or use a built-in slug.",
        },
        { status: 400 }
      )
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
  const nextFloors = landOnly
    ? undefined
    : property.floors !== undefined
      ? property.floors
      : properties[index].floors;

  properties[index] = {
    ...properties[index],
    ...property,
    types: types,
    mainArea: mainArea,
    subArea: subArea,
    bedrooms: nextBedrooms,
    floors: nextFloors,
    bathrooms: nextBathrooms,
    price: property.price,
    features: normalizePropertyFeatures(
      property.features ?? properties[index].features
    ),
    availableFrom: normalizeAvailableFrom(
      property.hasOwnProperty("availableFrom")
        ? property.availableFrom
        : properties[index].availableFrom
    ),
    updatedAt: new Date().toISOString(),
  };

  return properties;
}

type PendingPropertyEvent = {
  propertyId: string;
  eventType: "created" | "updated" | "archived" | "restored" | "deleted";
  comment?: string;
  changedFields?: Record<string, { from: unknown; to: unknown }>;
};

async function flushPropertyEvents(events: PendingPropertyEvent[]): Promise<void> {
  for (const event of events) {
    await safeAppendPropertyEvent(event);
  }
}

function requireArchiveComment(raw: unknown): string {
  const comment = typeof raw === "string" ? raw.trim() : "";
  if (!comment) {
    throw new MutationHttpError(
      apiJson({ error: "Comment is required when archiving a listing." }, { status: 400 })
    );
  }
  return comment;
}

function requireDeleteComment(raw: unknown): string {
  const comment = typeof raw === "string" ? raw.trim() : "";
  if (!comment) {
    throw new MutationHttpError(
      apiJson({ error: "Comment is required when permanently deleting a listing." }, { status: 400 })
    );
  }
  return comment;
}

function collectUpdateEvents(
  before: Property,
  after: Property,
  historyComment?: string
): PendingPropertyEvent[] {
  const events: PendingPropertyEvent[] = [];
  const wasArchived = before.archived === true;
  const isArchived = after.archived === true;

  if (!wasArchived && isArchived) {
    events.push({
      propertyId: after.id,
      eventType: "archived",
      comment: historyComment,
    });
  } else if (wasArchived && !isArchived) {
    events.push({
      propertyId: after.id,
      eventType: "restored",
    });
  }

  const fieldChanges = diffPropertyFields(before, after);
  if (Object.keys(fieldChanges).length > 0) {
    events.push({
      propertyId: after.id,
      eventType: "updated",
      changedFields: fieldChanges,
    });
  }

  return events;
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
    .map((p) => ({ ...propertyWithNormalizedAvailability(p), publicSlug: slugIdx.segmentFor(p) }));
  const archived = valid
    .filter((p) => p.archived === true)
    .sort(sortFn)
    .map((p) => ({ ...propertyWithNormalizedAvailability(p), publicSlug: slugIdx.segmentFor(p) }));
  return { properties: main, archivedProperties: archived };
}

function getPropertiesForRequest(
  fullList: Property[],
  searchParams: URLSearchParams
): { properties: Array<Property & { publicSlug: string }> } {
  const archiveFilter = searchParams.get("archived");
  const idsParam = searchParams.get("ids");

  let validProperties = fullList.filter((p) => p && p.id && hasValidPrice(p));

  if (idsParam?.trim()) {
    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
    const idSet = new Set(ids);
    validProperties = validProperties.filter(
      (p) => p.id != null && idSet.has(String(p.id))
    );
  } else if (archiveFilter === "true") {
    validProperties = validProperties.filter((p) => p.archived === true);
  } else if (archiveFilter === "false" || !archiveFilter) {
    validProperties = validProperties.filter((p) => p.archived !== true);
  }

  const sorted = [...validProperties].sort(
    (a, b) => (a.order ?? 999) - (b.order ?? 999)
  );

  const allForSlugs = fullList.filter((p) => p && p.id && hasValidPrice(p));
  const slugIdx = buildPropertySlugIndex(allForSlugs);
  const withSlugs = sorted.map((p) => ({
    ...propertyWithNormalizedAvailability(p),
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

    return await runExclusiveCatalogWrite(async () => {
      let newProperty!: Property;
      const finalList = await writeBlobJsonArrayWithRetry({
        read: loadFullPropertyList,
        write: persistPropertyList,
        verifyAfterWrite: useStrictCatalogWriteVerification
          ? verifyPropertyCatalogWrite
          : fastCatalogWriteVerify,
        maxAttempts: useStrictCatalogWriteVerification ? 28 : 1,
        mutate: async (properties) => {
          const types: PropertyType[] = normalizeTypesInput(
            property.types !== undefined
              ? property.types
              : property.type !== undefined
                ? [property.type]
                : ["rent"]
          );
          const landOnly = isLandOnlyTypes(types);

          if (!property.villaNumber?.trim()) {
            throw new MutationHttpError(
              apiJson({ error: "Missing required fields: villaNumber" }, { status: 400 })
            );
          }
          if (!landOnly && (!property.bedrooms || property.bedrooms < 1)) {
            throw new MutationHttpError(
              apiJson({ error: "Missing required fields: bedrooms" }, { status: 400 })
            );
          }

          const villaKey = normalizeVillaNumberKey(property.villaNumber);
          const duplicate = findVillaNumberConflict(properties, villaKey);
          if (duplicate) {
            throw new MutationHttpError(
              apiJson(
                {
                  error:
                    "This villa number is already used by another listing. Choose a different number.",
                },
                { status: 409 }
              )
            );
          }

          const hasAnyPrice =
            property.price &&
            (typeof property.price.min === "number" ||
              typeof property.price.monthly === "number" ||
              typeof property.price.forSale === "number");
          if (!hasAnyPrice) {
            property.price = {
              currency: property.priceCurrency || "IDR",
              min:
                property.price?.min ??
                property.price?.monthly ??
                property.priceForSale ??
                property.priceMin ??
                0,
              monthly: property.price?.monthly,
              yearly: property.price?.yearly,
              forSale: property.price?.forSale ?? property.priceForSale,
            };
          }

          const mainArea = property.mainArea || "ubud";
          if (!isValidMainAreaSlug(mainArea)) {
            throw new MutationHttpError(
              apiJson(
                {
                  error:
                    "Invalid or unknown main area. Add the area in Admin → Catalog structure, or use a built-in slug.",
                },
                { status: 400 }
              )
            );
          }

          newProperty = {
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
            floors: landOnly ? undefined : (property.floors ?? undefined),
            bathrooms: landOnly ? undefined : property.bathrooms,
            price: property.price,
            duration: property.duration,
            features: normalizePropertyFeatures(property.features),
            images: Array.isArray(property.images) ? property.images : [],
            order: property.order ?? properties.length,
            archived: property.archived === true,
            availableFrom: normalizeAvailableFrom(property.availableFrom ?? undefined),
            createdAt: property.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          properties.push(newProperty);
          return properties;
        },
      });

      await flushPropertyEvents([
        { propertyId: newProperty.id, eventType: "created" },
      ]);

      return apiJson({
        property: newProperty,
        ...buildListsWithSlugs(finalList),
      });
    });
  } catch (error) {
    if (error instanceof MutationHttpError) {
      return error.response;
    }
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
    const body = await request.json();

    return await runExclusiveCatalogWrite(async () => {
      const { action, property, newOrder, historyComment } = body;
      const pendingEvents: PendingPropertyEvent[] = [];

      const finalList = await writeBlobJsonArrayWithRetry({
        read: loadFullPropertyList,
        write: persistPropertyList,
        verifyAfterWrite: useStrictCatalogWriteVerification
          ? verifyPropertyCatalogWrite
          : fastCatalogWriteVerify,
        maxAttempts: useStrictCatalogWriteVerification ? 28 : 1,
        mutate: async (properties) => {
          if (action === "reorder") {
            return newOrder.map((id: string, index: number) => {
              const prop = properties.find((p) => p.id === id);
              return prop ? { ...prop, order: index, updatedAt: new Date().toISOString() } : null;
            }).filter(Boolean) as Property[];
          }

          if (action === "update" && property) {
            const before = properties.find((p) => p.id === property.id);
            if (!before) {
              throw new MutationHttpError(
                apiJson(
                  { error: `Property not found in data file: ${String(property.id)}` },
                  { status: 404 }
                )
              );
            }

            const willBeArchived = property.archived === true;
            const wasArchived = before.archived === true;
            let archiveComment: string | undefined;
            if (!wasArchived && willBeArchived) {
              archiveComment = requireArchiveComment(historyComment);
            }

            updateSingleProperty(properties, property);
            const after = properties.find((p) => p.id === property.id);
            if (after) {
              pendingEvents.push(...collectUpdateEvents(before, after, archiveComment));
            }
            return properties;
          }

          throw new MutationHttpError(
            apiJson({ error: "Invalid action or missing property" }, { status: 400 })
          );
        },
      });

      await flushPropertyEvents(pendingEvents);

      return apiJson({
        success: true,
        ...buildListsWithSlugs(finalList),
      });
    });
  } catch (error) {
    if (error instanceof MutationHttpError) {
      return error.response;
    }
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

    let deleteComment = "";
    try {
      const body = await request.json();
      deleteComment = requireDeleteComment(body.comment);
    } catch (error) {
      if (error instanceof MutationHttpError) {
        return error.response;
      }
      return apiJson(
        { error: "Comment is required when permanently deleting a listing." },
        { status: 400 }
      );
    }

    return await runExclusiveCatalogWrite(async () => {
      let propertyExists = false;
      const finalList = await writeBlobJsonArrayWithRetry({
        read: loadFullPropertyList,
        write: persistPropertyList,
        verifyAfterWrite: useStrictCatalogWriteVerification
          ? verifyPropertyCatalogWrite
          : fastCatalogWriteVerify,
        maxAttempts: useStrictCatalogWriteVerification ? 28 : 1,
        mutate: async (properties) => {
          propertyExists = properties.some((p) => p.id === id);
          if (!propertyExists) {
            throw new MutationHttpError(
              apiJson({ error: `Property not found in data file: ${id}` }, { status: 404 })
            );
          }
          return properties.filter((p) => p.id !== id);
        },
      });

      await flushPropertyEvents([
        { propertyId: id, eventType: "deleted", comment: deleteComment },
      ]);

      return apiJson({
        success: true,
        ...buildListsWithSlugs(finalList),
      });
    });
  } catch (error) {
    if (error instanceof MutationHttpError) {
      return error.response;
    }
    console.error("Error deleting property:", error);
    return apiJson(
      { error: "Failed to delete property" },
      { status: 500 }
    );
  }
}
