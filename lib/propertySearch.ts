import type { MainArea, Property, SubArea } from "@/types/property";
import { areas, subAreaNames } from "@/types/areas";
import { fixDescriptionDisplay, getPropertyDisplayTitle } from "@/lib/propertyUtils";

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tokens for matching (min length 2). */
function tokenize(query: string): string[] {
  const n = normalizeText(query);
  if (!n) return [];
  return n
    .split(/[^a-z0-9]+/g)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

export function parseBedroomsHint(query: string): number | undefined {
  const n = normalizeText(query);
  const m1 = n.match(/\b(\d{1,2})\s*(?:bed|bedroom|bedrooms|br|brs)\b/);
  if (m1) {
    const v = parseInt(m1[1], 10);
    if (v >= 0 && v <= 20) return v;
  }
  const m2 = n.match(/\b(\d{1,2})\s*bhk\b/);
  if (m2) {
    const v = parseInt(m2[1], 10);
    if (v >= 0 && v <= 20) return v;
  }
  return undefined;
}

function mainAreasMatchingQuery(query: string): MainArea[] {
  const n = normalizeText(query);
  if (n.length < 2) return [];
  const out: MainArea[] = [];
  for (const row of Object.values(areas)) {
    const slug = row.id as MainArea;
    const needles = [normalizeText(row.nameEn), normalizeText(row.name), normalizeText(slug.replace(/-/g, " "))].filter(
      (x) => x.length >= 2
    );
    if (needles.some((t) => n.includes(t))) out.push(slug);
  }
  return [...new Set(out)];
}

function subAreasMatchingQuery(query: string): SubArea[] {
  const n = normalizeText(query);
  const out: SubArea[] = [];
  for (const [slug, name] of Object.entries(subAreaNames) as [SubArea, string][]) {
    const nn = normalizeText(name);
    if (nn.length >= 3 && n.includes(nn)) out.push(slug);
    if (n.includes(slug)) out.push(slug);
  }
  return [...new Set(out)];
}

function buildHaystack(p: Property): string {
  const title = getPropertyDisplayTitle(p);
  const raw = p.title?.trim() ?? "";
  const desc = fixDescriptionDisplay(p.description).slice(0, 4000);
  const sub = p.subArea ? subAreaNames[p.subArea] ?? p.subArea : "";
  const main = p.mainArea ? areas[p.mainArea as keyof typeof areas]?.nameEn ?? p.mainArea : "";
  const vn = p.villaNumber?.trim() ?? "";
  const parts = [title, raw, desc, main, sub, vn, p.id, p.mainArea, p.subArea ?? ""].filter(Boolean);
  return normalizeText(parts.join(" \n "));
}

/**
 * Score properties for a free-text query. No network — use from API or RSC.
 */
export function rankPropertiesForSearch(properties: Property[], query: string, limit: number): Property[] {
  const q = query.trim();
  if (!q) return [];

  const hayNorm = normalizeText(q);
  const tokens = tokenize(q);
  const bedHint = parseBedroomsHint(q);
  const areaHints = mainAreasMatchingQuery(q);
  const subHints = subAreasMatchingQuery(q);

  const scored = properties.map((p) => {
    let score = 0;
    const hay = buildHaystack(p);

    if (hay.includes(hayNorm)) score += 120;

    for (const t of tokens) {
      if (t.length >= 8 && hay.includes(t)) score += 35;
      else if (t.length >= 4 && hay.includes(t)) score += 22;
      else if (hay.includes(t)) score += 12;
    }

    const idShort = p.id.replace(/^prop-?/i, "").toLowerCase();
    if (idShort && hayNorm.includes(idShort)) score += 200;

    const vn = (p.villaNumber ?? "").trim().toLowerCase();
    if (vn && hayNorm.includes(normalizeText(vn))) score += 90;

    if (bedHint !== undefined && p.bedrooms === bedHint) score += 75;

    if (areaHints.length > 0 && areaHints.includes(p.mainArea)) score += 65;

    if (subHints.length > 0 && p.subArea && subHints.includes(p.subArea)) score += 55;

    return { p, score };
  });

  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.p.id.localeCompare(b.p.id))
    .slice(0, limit)
    .map((x) => x.p);
}

export type PropertySearchApiHit = {
  id: string;
  title: string;
  meta: string;
  thumbUrl: string | null;
  href: string;
};

export function propertiesToSearchHits(
  list: Property[],
  segmentFor: (p: Property) => string
): PropertySearchApiHit[] {
  return list.map((p) => {
    const main = p.mainArea ? areas[p.mainArea as keyof typeof areas]?.nameEn ?? p.mainArea : "";
    const sub = p.subArea ? subAreaNames[p.subArea] : "";
    const beds = p.bedrooms ?? 0;
    const bedLabel = beds === 1 ? "1 bed" : `${beds} beds`;
    const metaParts = [main, sub, bedLabel].filter(Boolean);
    const thumb = p.images?.[0]?.trim() || null;
    return {
      id: p.id,
      title: getPropertyDisplayTitle(p),
      meta: metaParts.join(" · "),
      thumbUrl: thumb,
      href: `/properties/${segmentFor(p)}`,
    };
  });
}
