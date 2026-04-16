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

/** Same normalization applied in `readPropertiesFromBlob` / disk read before use. */
export function withNormalizedCatalogFeatures(list: Property[]): Property[] {
  return list.map((p) => ({
    ...p,
    features: normalizePropertyFeatures(p.features as Partial<Record<string, unknown>> | undefined),
  }));
}

async function readPropertiesFromDisk(): Promise<Property[]> {
  const fileContent = await readFile(DATA_FILE, "utf-8");
  return withNormalizedCatalogFeatures(parsePropertiesFile(fileContent));
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

    const downloadUrl = match.downloadUrl;
    const urlWithCacheBust = `${downloadUrl}${downloadUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;
    const res = await fetch(urlWithCacheBust, {
      cache: "no-store",
      headers: { Pragma: "no-cache", "Cache-Control": "no-cache" },
    });
    if (!res.ok) return null;

    const data: unknown = await res.json();
    if (!Array.isArray(data)) return null;

    return withNormalizedCatalogFeatures(data as Property[]);
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
 * Serialize read→modify→write so concurrent PUTs on one Node instance cannot drop each other's changes.
 * Different Vercel serverless instances still race; for a hard guarantee use a DB or Redis lock.
 */
let catalogWriteChain: Promise<unknown> = Promise.resolve();

export function runExclusiveCatalogWrite<T>(fn: () => Promise<T>): Promise<T> {
  const next = catalogWriteChain.then(() => fn());
  catalogWriteChain = next.then(
    () => undefined,
    () => undefined
  );
  return next as Promise<T>;
}

/**
 * Round-trip through TS generator + parser so stored JSON matches on-disk shape (no stray form fields).
 * Exported so admin API can verify Blob writes against the same shape `persistPropertyList` stores.
 */
export function normalizePropertyListForPersistence(properties: Property[]): Property[] {
  const ts = generatePropertiesFile(properties);
  return parsePropertiesFile(ts);
}

export async function persistPropertyList(properties: Property[]): Promise<void> {
  const normalized = normalizePropertyListForPersistence(properties);

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
