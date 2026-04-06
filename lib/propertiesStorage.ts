import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { list, put } from "@vercel/blob";
import type { Property } from "@/types/property";
import { normalizePropertyFeatures } from "@/lib/featureState";
import { parsePropertiesFile } from "@/lib/parseProperties";
import { generatePropertiesFile } from "@/lib/generatePropertiesFile";

const DATA_FILE = join(process.cwd(), "data", "properties.ts");

/** Blob pathname for full catalog JSON (separate from `properties/*` image uploads). */
export const PROPERTIES_CATALOG_BLOB_PATH = "_catalog/properties.json";

/**
 * On Vercel the filesystem is read-only; persist catalog to Blob instead of data/properties.ts.
 * Locally we keep the TypeScript file unless PROPERTIES_PERSIST_BLOB=1 (optional QA of blob path).
 */
export function useBlobPersistence(): boolean {
  if (process.env.PROPERTIES_PERSIST_BLOB === "1") {
    return !!process.env.BLOB_READ_WRITE_TOKEN;
  }
  return !!process.env.BLOB_READ_WRITE_TOKEN && process.env.VERCEL === "1";
}

function withNormalizedFeatures(list: Property[]): Property[] {
  return list.map((p) => ({
    ...p,
    features: normalizePropertyFeatures(p.features as Partial<Record<string, unknown>> | undefined),
  }));
}

async function readPropertiesFromDisk(): Promise<Property[]> {
  const fileContent = await readFile(DATA_FILE, "utf-8");
  return withNormalizedFeatures(parsePropertiesFile(fileContent));
}

async function readPropertiesFromBlob(): Promise<Property[] | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;

  try {
    const { blobs } = await list({
      prefix: PROPERTIES_CATALOG_BLOB_PATH,
      limit: 20,
      token,
    });
    const match = blobs.find((b) => b.pathname === PROPERTIES_CATALOG_BLOB_PATH) ?? blobs[0];
    if (!match) return null;

    const res = await fetch(match.downloadUrl, { cache: "no-store" });
    if (!res.ok) return null;

    const data: unknown = await res.json();
    if (!Array.isArray(data)) return null;

    return withNormalizedFeatures(data as Property[]);
  } catch (e) {
    console.error("[propertiesStorage] blob read failed:", e);
    return null;
  }
}

/** Full property list (all archived states). Source of truth: Blob on Vercel when enabled, else data/properties.ts. */
export async function loadFullPropertyList(): Promise<Property[]> {
  if (useBlobPersistence()) {
    const fromBlob = await readPropertiesFromBlob();
    if (fromBlob !== null) return fromBlob;
  }
  return readPropertiesFromDisk();
}

/**
 * Round-trip through TS generator + parser so stored JSON matches on-disk shape (no stray form fields).
 */
function normalizeForPersistence(properties: Property[]): Property[] {
  const ts = generatePropertiesFile(properties);
  return parsePropertiesFile(ts);
}

export async function persistPropertyList(properties: Property[]): Promise<void> {
  const normalized = normalizeForPersistence(properties);

  if (useBlobPersistence()) {
    await put(PROPERTIES_CATALOG_BLOB_PATH, JSON.stringify(normalized), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
      cacheControlMaxAge: 0,
    });
    return;
  }

  await writeFile(DATA_FILE, generatePropertiesFile(normalized), "utf-8");
}
