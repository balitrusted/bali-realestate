import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { list, put } from "@vercel/blob";
import type { Property } from "@/types/property";
import { normalizePropertyFeatures } from "@/lib/featureState";
import { parsePropertiesFile } from "@/lib/parseProperties";
import { generatePropertiesFile } from "@/lib/generatePropertiesFile";
import { getPropertiesRolloutMode } from "@/lib/dataRollout";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabaseServer";

const DATA_FILE = join(process.cwd(), "data", "properties.ts");
const getBlobStoreBaseUrl = () => process.env.BLOB_STORE_URL?.trim().replace(/\/$/, "");
const OBS_ENABLED = process.env.DATA_MIGRATION_OBSERVABILITY === "1";

/** Blob pathname for full catalog JSON (separate from `properties/*` image uploads). */
export const PROPERTIES_CATALOG_BLOB_PATH = "_catalog/properties.json";
const PROPERTIES_CATALOG_SUPABASE_ID = "main";

function reportMetric(
  event: string,
  details: Record<string, string | number | boolean | null | undefined>
): void {
  if (!OBS_ENABLED) return;
  console.info(`[properties_catalog] ${event}`, details);
}

/**
 * On Vercel the filesystem is read-only; persist catalog to Blob instead of data/properties.ts.
 * Locally we keep the TypeScript file unless PROPERTIES_PERSIST_BLOB=1 (optional QA of blob path).
 */
export function shouldUseBlobPersistence(): boolean {
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
    const baseUrl = getBlobStoreBaseUrl();
    if (baseUrl) {
      const directUrl = `${baseUrl}/${PROPERTIES_CATALOG_BLOB_PATH}`;
      const directWithCacheBust = `${directUrl}${directUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;
      const directRes = await fetch(directWithCacheBust, {
        cache: "no-store",
        headers: { Pragma: "no-cache", "Cache-Control": "no-cache" },
      });
      if (directRes.ok) {
        const directData: unknown = await directRes.json();
        if (Array.isArray(directData)) {
          return withNormalizedCatalogFeatures(directData as Property[]);
        }
      }
    }

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

async function readPropertiesFromSupabase(): Promise<Property[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("properties_catalog")
      .select("payload")
      .eq("id", PROPERTIES_CATALOG_SUPABASE_ID)
      .maybeSingle();
    if (error) {
      console.error("[propertiesStorage] supabase read failed:", error.message);
      return null;
    }
    const payload = data?.payload;
    if (!Array.isArray(payload)) return null;
    return withNormalizedCatalogFeatures(payload as Property[]);
  } catch (e) {
    console.error("[propertiesStorage] supabase read exception:", e);
    return null;
  }
}

/** Full property list (all archived states). Source of truth: Blob on Vercel when enabled, else data/properties.ts. */
export async function loadFullPropertyList(): Promise<Property[]> {
  const mode = getPropertiesRolloutMode();
  const startedAt = Date.now();

  if (mode === "supabase") {
    const fromSupabase = await readPropertiesFromSupabase();
    if (fromSupabase !== null) {
      reportMetric("read_ok", {
        mode,
        source: "supabase",
        rows: fromSupabase.length,
        elapsedMs: Date.now() - startedAt,
      });
      return fromSupabase;
    }
    reportMetric("read_fallback", {
      mode,
      source: shouldUseBlobPersistence() ? "blob_or_disk" : "disk",
      elapsedMs: Date.now() - startedAt,
    });
  }

  if (shouldUseBlobPersistence()) {
    const fromBlob = await readPropertiesFromBlob();
    if (fromBlob !== null) {
      reportMetric("read_ok", {
        mode,
        source: "blob",
        rows: fromBlob.length,
        elapsedMs: Date.now() - startedAt,
      });
      return fromBlob;
    }
  }
  const fromDisk = await readPropertiesFromDisk();
  reportMetric("read_ok", {
    mode,
    source: "disk",
    rows: fromDisk.length,
    elapsedMs: Date.now() - startedAt,
  });
  return fromDisk;
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

async function persistPropertyListToBlobOrDisk(properties: Property[]): Promise<void> {
  const normalized = normalizePropertyListForPersistence(properties);

  if (shouldUseBlobPersistence()) {
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

async function persistPropertyListToSupabase(properties: Property[]): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("[propertiesStorage] Supabase is not configured");
  }
  const normalized = normalizePropertyListForPersistence(properties);
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("properties_catalog").upsert(
    {
      id: PROPERTIES_CATALOG_SUPABASE_ID,
      payload: normalized,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id", ignoreDuplicates: false }
  );
  if (error) {
    throw new Error(`[propertiesStorage] supabase write failed: ${error.message}`);
  }
}

export async function persistPropertyList(properties: Property[]): Promise<void> {
  const mode = getPropertiesRolloutMode();
  const startedAt = Date.now();

  if (mode === "blob") {
    await persistPropertyListToBlobOrDisk(properties);
    reportMetric("write_ok", {
      mode,
      target: shouldUseBlobPersistence() ? "blob" : "disk",
      elapsedMs: Date.now() - startedAt,
    });
    return;
  }

  if (mode === "dual-write") {
    await persistPropertyListToBlobOrDisk(properties);
    try {
      await persistPropertyListToSupabase(properties);
      reportMetric("write_ok", {
        mode,
        target: "supabase",
        elapsedMs: Date.now() - startedAt,
      });
    } catch (e) {
      console.error("[propertiesStorage] dual-write Supabase write failed:", e);
      reportMetric("write_error", {
        mode,
        target: "supabase",
        elapsedMs: Date.now() - startedAt,
      });
    }
    return;
  }

  try {
    await persistPropertyListToSupabase(properties);
    reportMetric("write_ok", {
      mode,
      target: "supabase",
      elapsedMs: Date.now() - startedAt,
    });
  } catch (e) {
    console.error("[propertiesStorage] Supabase write failed, fallback to Blob/Disk:", e);
    await persistPropertyListToBlobOrDisk(properties);
    reportMetric("write_fallback", {
      mode,
      target: shouldUseBlobPersistence() ? "blob" : "disk",
      elapsedMs: Date.now() - startedAt,
    });
  }
}
