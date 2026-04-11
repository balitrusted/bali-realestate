import { list, put } from "@vercel/blob";
import type { GlossaryTerm } from "@/types/glossary";

const BLOB_KEY = "data/glossary.json";

function getBlobStoreBaseUrl(): string | undefined {
  return process.env.BLOB_STORE_URL?.trim().replace(/\/$/, "");
}

function appendCacheBuster(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${Date.now()}`;
}

function termRecencyScore(t: GlossaryTerm): number {
  const u = t.updatedAt ? Date.parse(t.updatedAt) : NaN;
  const c = t.createdAt ? Date.parse(t.createdAt) : NaN;
  return Number.isFinite(u) ? u : Number.isFinite(c) ? c : 0;
}

function dedupeGlossaryBySlug(terms: GlossaryTerm[], bundledLocalIds: Set<string>): GlossaryTerm[] {
  const prefer = (a: GlossaryTerm, b: GlossaryTerm): GlossaryTerm => {
    const sa = termRecencyScore(a);
    const sb = termRecencyScore(b);
    if (sa !== sb) return sa > sb ? a : b;
    const aLocal = bundledLocalIds.has(a.id);
    const bLocal = bundledLocalIds.has(b.id);
    if (aLocal && !bLocal) return a;
    if (!aLocal && bLocal) return b;
    return a.id.localeCompare(b.id) <= 0 ? a : b;
  };
  const bySlug = new Map<string, GlossaryTerm>();
  for (const t of terms) {
    const cur = bySlug.get(t.slug);
    bySlug.set(t.slug, cur ? prefer(t, cur) : t);
  }
  return Array.from(bySlug.values());
}

/** Raw terms from Blob JSON only (for verification after admin saves). */
export async function readGlossaryTermsFromBlobRaw(): Promise<GlossaryTerm[] | null> {
  const baseUrl = getBlobStoreBaseUrl();
  if (baseUrl) {
    const res = await fetch(appendCacheBuster(`${baseUrl}/${BLOB_KEY}`), { cache: "no-store" });
    if (res.ok) {
      const data: unknown = await res.json();
      if (Array.isArray(data)) return data as GlossaryTerm[];
    }
  }
  const { blobs } = await list({ prefix: BLOB_KEY, limit: 5 });
  const match = blobs?.find((b) => b.pathname === BLOB_KEY);
  if (match?.url) {
    const res = await fetch(appendCacheBuster(match.url), { cache: "no-store" });
    if (res.ok) {
      const data: unknown = await res.json();
      if (Array.isArray(data)) return data as GlossaryTerm[];
    }
  }
  return null;
}

export async function getAllGlossaryTerms(): Promise<GlossaryTerm[]> {
  const { glossaryTerms: localTerms } = await import("@/data/glossary");
  const local = [...localTerms];
  const bundledIds = new Set(local.map((t) => t.id));

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return local;
  }

  try {
    const blobTerms = await readGlossaryTermsFromBlobRaw();
    if (blobTerms && blobTerms.length > 0) {
      const score = (t: GlossaryTerm) => termRecencyScore(t);
      const byId = new Map<string, GlossaryTerm>();
      for (const t of local) byId.set(t.id, t);
      for (const b of blobTerms) {
        const ex = byId.get(b.id);
        if (!ex) {
          byId.set(b.id, b);
        } else {
          byId.set(b.id, score(b) > score(ex) ? b : ex);
        }
      }
      const merged = Array.from(byId.values());
      return dedupeGlossaryBySlug(merged, bundledIds);
    }
  } catch {
    /* use bundled */
  }

  return local;
}

export async function saveGlossaryTermsToBlob(terms: GlossaryTerm[]): Promise<void> {
  await put(BLOB_KEY, JSON.stringify(terms), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    cacheControlMaxAge: 0,
  });
}
