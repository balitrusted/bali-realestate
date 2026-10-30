/** Parse `displayLocation` as "lat,lng" (decimal degrees). */
export function parseLatLng(raw?: string | null): [number, number] | null {
  if (!raw) return null;
  const parts = raw.split(",").map((p) => p.trim());
  if (parts.length !== 2) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

/** Extract explicit coordinates from common Google Maps / map URLs without geocoding the address. */
export function parseLatLngFromMapUrl(raw?: string | null): string | null {
  if (!raw) return null;
  let decoded = raw.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Keep the original URL if it contains malformed percent-encoding.
  }

  const patterns = [
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /(?:[?&](?:q|query|ll|center)=)(-?\d+(?:\.\d+)?)(?:%2C|,|\s)+(-?\d+(?:\.\d+)?)/i,
  ];

  for (const pattern of patterns) {
    const match = decoded.match(pattern);
    if (!match) continue;
    const coordinates = `${match[1]},${match[2]}`;
    if (parseLatLng(coordinates)) return coordinates;
  }
  return null;
}
