const RELATION_ID = 20447663;

const res = await fetch("https://overpass.kumi.systems/api/interpreter", {
  method: "POST",
  headers: {
    "Content-Type": "text/plain",
    "User-Agent": "Balitrusted/1.0 (bali-realestate boundary export)",
  },
  body: `[out:json][timeout:25]; relation(${RELATION_ID}); out geom;`,
});
const data = await res.json();
const rel = data.elements[0];
const coords = [];

for (const member of rel.members) {
  if (member.role !== "outer" || !member.geometry) continue;
  for (const point of member.geometry) {
    const c = [point.lon, point.lat];
    const prev = coords[coords.length - 1];
    if (!prev || prev[0] !== c[0] || prev[1] !== c[1]) coords.push(c);
  }
}

if (
  coords.length &&
  (coords[0][0] !== coords[coords.length - 1][0] ||
    coords[0][1] !== coords[coords.length - 1][1])
) {
  coords.push(coords[0]);
}

const geojson = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Mas",
        official_name: "Desa Mas",
        admin_level: "7",
        source: `OpenStreetMap relation ${RELATION_ID} (BPS administrative boundary)`,
        note: "North corridor overlaps daily-life anchors shared with Lodtunduh on Jl. A.A. Gede Rai. Compare with Google Maps desa boundary before publishing.",
      },
      geometry: {
        type: "Polygon",
        coordinates: [coords],
      },
    },
  ],
};

await import("node:fs/promises").then(async (fs) => {
  await fs.mkdir("public/mas-photos", { recursive: true });
  await fs.writeFile(
    "public/mas-photos/mas-boundary.geojson",
    JSON.stringify(geojson, null, 2)
  );
});

console.log(`Saved Mas polygon with ${coords.length} points`);
console.log(
  `Bounds lat ${rel.bounds.minlat}..${rel.bounds.maxlat}, lon ${rel.bounds.minlon}..${rel.bounds.maxlon}`
);
