const res = await fetch("https://overpass.kumi.systems/api/interpreter", {
  method: "POST",
  headers: {
    "Content-Type": "text/plain",
    "User-Agent": "Balitrusted/1.0 (bali-realestate boundary export)",
  },
  body: "[out:json][timeout:25]; relation(20447665); out geom;",
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
        name: "Lodtunduh",
        official_name: "Desa Lodtunduh",
        admin_level: "7",
        source: "OpenStreetMap relation 20447665 (BPS administrative boundary)",
        note: "Compare with Google Maps desa boundary before publishing.",
      },
      geometry: {
        type: "Polygon",
        coordinates: [coords],
      },
    },
  ],
};

await import("node:fs/promises").then((fs) =>
  fs.writeFile(
    "public/lodtunduh-photos/lodtunduh-boundary.geojson",
    JSON.stringify(geojson, null, 2)
  )
);

console.log(`Saved polygon with ${coords.length} points`);
console.log(
  `Bounds lat ${rel.bounds.minlat}..${rel.bounds.maxlat}, lon ${rel.bounds.minlon}..${rel.bounds.maxlon}`
);
