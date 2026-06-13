/**
 * Approximate Desa Adat Penestanan boundary for the area guide map.
 * Penestanan is a recognized adat village within Kelurahan Sayan (no separate Kemendagri desa).
 * Polygon is hand-traced from Google Maps desa-adat outline — verify before treating as official.
 *
 * Run: node scripts/export-penestanan-boundary.mjs
 */

const ring = [
  [115.2415, -8.4978],
  [115.247, -8.4965],
  [115.254, -8.4975],
  [115.259, -8.5005],
  [115.261, -8.506],
  [115.26, -8.511],
  [115.256, -8.5165],
  [115.25, -8.5185],
  [115.244, -8.5175],
  [115.2395, -8.514],
  [115.2385, -8.508],
  [115.2398, -8.5015],
  [115.2415, -8.4978],
];

const geojson = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Penestanan",
        official_name: "Desa Adat Penestanan",
        admin_parent: "Kelurahan Sayan, Kecamatan Ubud",
        source:
          "Approximate desa-adat outline traced from Google Maps (not Kemendagri desa boundary)",
        note: "POI pins will be added in a later update. Compare on site before publishing legal claims.",
      },
      geometry: {
        type: "Polygon",
        coordinates: [ring],
      },
    },
  ],
};

await import("node:fs/promises").then((fs) =>
  fs.writeFile(
    "public/penestanan-photos/penestanan-boundary.geojson",
    JSON.stringify(geojson, null, 2)
  )
);

console.log(`Saved Penestanan boundary with ${ring.length} points`);
