import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPropertyManualRedirect } from "@/lib/propertyRedirects";
import { subAreaNames } from "@/types/areas";
import { SEO_BEDROOM_COUNTS, bedroomSegmentSlug } from "@/lib/catalogBedrooms";

const UBUD_SUB_SLUGS = new Set(Object.keys(subAreaNames));

/** First segment under `/properties` that is a catalog hub, not a listing slug. */
const CATALOG_ROOT = new Set(["rent", "sale", "villas", "land", "business", "hotels"]);

/** Single-segment routes under `/properties/...` that are not listing slug rewrites. */
const PROPERTIES_RESERVED_SEGMENTS = new Set(["p", "map", "archive"]);

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

function decodeBase64Url(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0)).buffer;
}

async function hasValidAdminSession(token?: string): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim() || process.env.ADMIN_PASSWORD?.trim();
  if (!secret || !token) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [encodedPayload, encodedSignature] = parts;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const signatureValid = await crypto.subtle.verify(
      "HMAC",
      key,
      decodeBase64Url(encodedSignature),
      new TextEncoder().encode(encodedPayload)
    );
    if (!signatureValid) return false;

    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(encodedPayload)));
    const now = Date.now();
    const sessionTtlMs = 12 * 60 * 60 * 1000;
    return (
      payload?.role === "admin" &&
      payload?.version === 1 &&
      Number.isFinite(payload?.issuedAt) &&
      Number.isFinite(payload?.expiresAt) &&
      payload.issuedAt <= now + 60_000 &&
      payload.expiresAt > now &&
      payload.expiresAt <= payload.issuedAt + sessionTtlMs
    );
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = normalizePathname(request.nextUrl.pathname);

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const token = request.cookies.get("admin-auth")?.value;
    const validSession = await hasValidAdminSession(token);

    if (pathname === "/admin/login" && validSession) {
      const adminUrl = request.nextUrl.clone();
      adminUrl.pathname = "/admin/properties";
      adminUrl.search = "";
      return NextResponse.redirect(adminUrl);
    }

    if (pathname !== "/admin/login" && !validSession) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      loginUrl.search = "";
      return NextResponse.redirect(loginUrl);
    }
  }

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

  /** Canonical rent payment URLs: /properties/rent/monthly instead of ?minDuration=1 */
  for (const rentType of ["rent", "villas"] as const) {
    if (pathname === `/properties/${rentType}`) {
      const md = request.nextUrl.searchParams.get("minDuration");
      if (md === "1" || md === "12") {
        const keys = Array.from(request.nextUrl.searchParams.keys());
        const allowed = new Set(["minDuration", "page"]);
        if (keys.every((k) => allowed.has(k))) {
          const url = request.nextUrl.clone();
          url.pathname = `/properties/${rentType}/${md === "12" ? "yearly" : "monthly"}`;
          url.searchParams.delete("minDuration");
          return NextResponse.redirect(url, 301);
        }
      }
    }
  }

  /** Canonical Ubud sub-area URLs: /properties/{type}/ubud/{subArea} instead of ?subArea= */
  const ubudArea = pathname.match(/^\/properties\/(villas|rent|sale|land|business|hotels)\/ubud$/);
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
  matcher: ["/properties/:path*", "/admin", "/admin/:path*"],
};
