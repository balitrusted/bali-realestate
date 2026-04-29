import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPropertyManualRedirect } from "@/lib/propertyRedirects";
import { subAreaNames } from "@/types/areas";
import { SEO_BEDROOM_COUNTS, bedroomSegmentSlug } from "@/lib/catalogBedrooms";

const UBUD_SUB_SLUGS = new Set(Object.keys(subAreaNames));

/** First segment under `/properties` that is a catalog hub, not a listing slug. */
const CATALOG_ROOT = new Set(["rent", "sale", "villas", "land", "business"]);

/** Single-segment routes under `/properties/...` that are not listing slug rewrites. */
const PROPERTIES_RESERVED_SEGMENTS = new Set(["p", "map", "archive"]);

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

export function middleware(request: NextRequest) {
  const pathname = normalizePathname(request.nextUrl.pathname);

  /** Canonical bedroom SEO URLs (rent/Ubud): /properties/rent/ubud/1-bedroom-villa */
  const ubudRent = pathname === "/properties/rent/ubud";
  if (ubudRent) {
    const rawBedrooms = request.nextUrl.searchParams.get("bedrooms");
    const bedroomParts = rawBedrooms?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
    const keys = Array.from(request.nextUrl.searchParams.keys());
    const allowedKeys = new Set(["bedrooms", "page"]);
    const hasOnlyAllowedKeys = keys.every((k) => allowedKeys.has(k));

    if (bedroomParts.length === 1 && hasOnlyAllowedKeys) {
      const count = Number(bedroomParts[0]);
      if ((SEO_BEDROOM_COUNTS as readonly number[]).includes(count)) {
        const url = request.nextUrl.clone();
        url.pathname = `/properties/rent/ubud/${bedroomSegmentSlug(count)}`;
        url.searchParams.delete("bedrooms");
        return NextResponse.redirect(url, 301);
      }
    }
  }

  /** Canonical Ubud sub-area URLs: /properties/{type}/ubud/{subArea} instead of ?subArea= */
  const ubudArea = pathname.match(/^\/properties\/(villas|rent|sale|land|business)\/ubud$/);
  if (ubudArea) {
    const raw = request.nextUrl.searchParams.get("subArea");
    if (raw && !raw.includes(",")) {
      const slug = raw.trim().toLowerCase();
      if (UBUD_SUB_SLUGS.has(slug)) {
        const url = request.nextUrl.clone();
        url.pathname = `/properties/${ubudArea[1]}/ubud/${slug}`;
        url.searchParams.delete("subArea");
        return NextResponse.redirect(url, 301);
      }
    }
  }

  const manual = getPropertyManualRedirect(pathname);
  if (manual) {
    const url = request.nextUrl.clone();
    url.pathname = manual.startsWith("/") ? manual : `/${manual}`;
    return NextResponse.redirect(url, 301);
  }

  // Internal rewrite target: hide `/properties/p/` from public URLs
  const internal = pathname.match(/^\/properties\/p\/([^/]+)$/);
  if (internal) {
    const url = request.nextUrl.clone();
    url.pathname = `/properties/${internal[1]}`;
    return NextResponse.redirect(url, 301);
  }

  const one = pathname.match(/^\/properties\/([^/]+)$/);
  if (one) {
    const seg = one[1];
    if (!PROPERTIES_RESERVED_SEGMENTS.has(seg) && !CATALOG_ROOT.has(seg)) {
      const url = request.nextUrl.clone();
      url.pathname = `/properties/p/${seg}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/properties/:path*"],
};
