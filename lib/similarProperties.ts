import { Property } from "@/types/property";
import { featureIsYes } from "@/lib/featureState";

function catalogKind(p: Property): "villa" | "land" | "business" {
  const villaLike = p.types.some((t) => t === "rent" || t === "sale");
  if (p.types.includes("land") && !villaLike) return "land";
  if (p.types.includes("business") && !villaLike) return "business";
  return "villa";
}

function refPrice(p: Property): number | null {
  const x = p.price;
  if (x.forSale != null && x.forSale > 0 && p.types.includes("sale")) return x.forSale;
  if (x.monthly != null && x.monthly > 0) return x.monthly;
  if (x.min != null && x.min > 0) return x.min;
  if (x.yearly != null && x.yearly > 0) return x.yearly / 12;
  return null;
}

function typeOverlap(a: Property, b: Property): number {
  const setA = new Set(a.types);
  let n = 0;
  for (const t of b.types) if (setA.has(t)) n++;
  return n;
}

/**
 * Rank neighbours for “Similar properties” (bedrooms, area, price band, shared types, pool).
 */
export function findSimilarProperties(
  current: Property,
  all: Property[],
  limit = 12
): Property[] {
  const ref = refPrice(current);
  const kind = catalogKind(current);
  const scored = all
    .filter((p) => p.id !== current.id && !p.archived && catalogKind(p) === kind)
    .map((p) => {
      let score = 0;
      if (p.mainArea === current.mainArea) score += 100;
      if (p.bedrooms === current.bedrooms) score += 80;
      else if (Math.abs(p.bedrooms - current.bedrooms) === 1) score += 35;

      const po = typeOverlap(current, p);
      score += po * 25;

      if (ref != null) {
        const pr = refPrice(p);
        if (pr != null && pr > 0) {
          const ratio = pr / ref;
          if (ratio >= 0.65 && ratio <= 1.45) score += 50;
          else if (ratio >= 0.45 && ratio <= 1.75) score += 25;
          score += Math.max(0, 20 - Math.min(20, Math.abs(Math.log(ratio)) * 30));
        }
      }

      if (featureIsYes(current.features.pool) && featureIsYes(p.features.pool)) score += 15;
      if (featureIsYes(current.features.pool) !== featureIsYes(p.features.pool)) score -= 5;

      if (p.subArea && p.subArea === current.subArea) score += 30;

      return { p, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ p }) => p);

  return scored;
}
