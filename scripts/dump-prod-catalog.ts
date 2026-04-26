/**
 * Fetch live catalog from production (public GET /api/properties) and print
 * a checklist for batch floor updates. Not run at build time.
 *
 * Usage: npx tsx scripts/dump-prod-catalog.ts [baseUrl]
 * Example: npx tsx scripts/dump-prod-catalog.ts https://balitrusted.com
 */
import { getPropertyDisplayTitle, isPureLandListing } from "../lib/propertyUtils";
import type { Property } from "../types/property";

async function main() {
  const base = (process.argv[2] ?? "https://balitrusted.com").replace(/\/$/, "");
  const url = `${base}/api/properties`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    console.error(`Failed: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const j = (await res.json()) as { properties?: Property[] };
  const list = j.properties ?? [];
  const sorted = [...list].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  const villas = sorted.filter((p) => !isPureLandListing(p));
  const lands = sorted.filter((p) => isPureLandListing(p));

  console.log(`# Source: ${url}`);
  console.log(`# Villas (non–land-only): ${villas.length}`);
  console.log(`# Land-only rows (floors N/A): ${lands.length}`);
  console.log("");
  console.log("# Copy block below: fill right side as 1 or 2 (or leave blank if unknown)");
  console.log("");

  for (const p of villas) {
    const name = getPropertyDisplayTitle(p);
    const vn = (p.villaNumber ?? "").trim().replace(/^#/, "") || "—";
    const floors = p.floors != null && p.floors > 0 ? String(p.floors) : "";
    const floorsCol = floors || "—";
    console.log(`${name}\t${floorsCol}\tid=${p.id}\tvilla#=${vn}`);
  }

  if (lands.length) {
    console.log("");
    console.log("# --- Land-only (no floors) ---");
    for (const p of lands) {
      console.log(`${getPropertyDisplayTitle(p)}\t—\tid=${p.id}`);
    }
  }
}

void main();
