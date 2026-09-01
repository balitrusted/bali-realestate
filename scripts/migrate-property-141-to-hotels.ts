import { loadEnvConfig } from "@next/env";
import { loadFullPropertyList, persistPropertyList } from "@/lib/propertiesStorage";
import { buildPropertySlugIndex } from "@/lib/propertySlug";
import { normalizeVillaNumberKey } from "@/lib/propertyUtils";
import type { Property, PropertyType } from "@/types/property";

loadEnvConfig(process.cwd());

const OLD_SLUG = "villa-141-2bed-ubud";
const TARGET_TITLE = "Retreat Center · 7 Joglo Villas · Pejeng";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const list = await loadFullPropertyList();
  const slugIdx = buildPropertySlugIndex(list);

  const target =
    list.find((p) => slugIdx.segmentFor(p).toLowerCase() === OLD_SLUG) ??
    list.find((p) => normalizeVillaNumberKey(p.villaNumber) === "141");

  if (!target) {
    console.error("Property #141 not found in catalog storage.");
    process.exit(1);
  }

  const oldSlug = slugIdx.segmentFor(target);
  const updated: Property[] = list.map((p) => {
    if (p.id !== target.id) return p;
    const types = Array.from(
      new Set<PropertyType>([
        ...(p.types ?? []).filter((t) => t !== "rent" && t !== "sale"),
        "hotels",
        "rent",
      ])
    );
    return {
      ...p,
      types,
      title: TARGET_TITLE,
      updatedAt: new Date().toISOString(),
    };
  });

  const migrated = updated.find((p) => p.id === target.id)!;
  const newSlug = buildPropertySlugIndex(updated).segmentFor(migrated);

  console.log(`Property id: ${target.id}`);
  console.log(`Old slug: /properties/${oldSlug}`);
  console.log(`New slug: /properties/${newSlug}`);
  console.log(`Types: ${migrated.types.join(", ")}`);
  console.log(`Title: ${TARGET_TITLE}`);

  if (dryRun) {
    console.log("Dry run — no changes written.");
    return;
  }

  await persistPropertyList(updated);
  console.log("Catalog updated in storage.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
