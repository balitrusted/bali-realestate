import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPropertyManualRedirect } from "@/lib/propertyRedirects";
import { subAreaNames } from "@/types/areas";

const UBUD_SUB_SLUGS = new Set(Object.keys(subAreaNames));

/** First segment under `/properties` that is a catalog hub, not a listing slug. */
const CATALOG_ROOT = new Set(["rent", "sale", "villas", "land", "business"]);

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

export function middleware(request: NextRequest) {
  const pathname = normalizePathname(request.nextUrl.pathname);

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
    if (seg !== "p" && !CATALOG_ROOT.has(seg)) {
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
