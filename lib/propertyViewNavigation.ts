import { Property } from "@/types/property";
import { areas } from "@/types/areas";

const MAX_RETURN_LEN = 2048;

/** Open-redirect safe path (already decoded). */
export function safeInternalPath(decoded: string): string | null {
  const trimmed = decoded.trim();
  if (!trimmed || trimmed.length > MAX_RETURN_LEN) return null;
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  if (trimmed.includes("://") || trimmed.includes("\\")) return null;
  if (trimmed.includes("@")) return null;
  return trimmed;
}

/**
 * Safe internal return path from ?returnTo= (legacy bookmarks; open-redirect safe).
 */
export function sanitizeReturnTo(raw: string | string[] | undefined): string | null {
  if (raw == null) return null;
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v || typeof v !== "string") return null;
  try {
    const decoded = decodeURIComponent(v.trim());
    return safeInternalPath(decoded);
  } catch {
    return null;
  }
}

function isVillaLike(p: Property): boolean {
  return p.types.some((t) => t === "rent" || t === "sale");
}

/** When ?returnTo= is missing: broad hubs — villas, land, business (no area; area only if user came via ?returnTo= with area). */
export function defaultListingPathForProperty(p: Property): string {
  if (p.types.includes("land") && !isVillaLike(p)) {
    return "/properties/land";
  }
  if (p.types.includes("business") && !isVillaLike(p)) {
    return "/properties/business";
  }
  if (isVillaLike(p)) {
    return "/properties/villas";
  }
  return "/properties/villas";
}

const TYPE_LABEL: Record<string, string> = {
  rent: "rentals",
  sale: "sale listings",
  villas: "villas",
  land: "land",
  business: "business",
};

/**
 * Human label + href for the back control on the property view page.
 */
export function getPropertyBackNavigation(
  property: Property,
  returnTo: string | null
): { href: string; label: string } {
  if (returnTo) {
    if (returnTo === "/" || returnTo === "") {
      return { href: "/", label: "Back to home" };
    }
    const pathOnly = returnTo.split("?")[0];
    if (pathOnly === "/properties") {
      return { href: returnTo, label: "Back to all properties" };
    }
    if (pathOnly === "/properties/villas") {
      return { href: returnTo, label: "Back to all villas" };
    }
    if (pathOnly === "/saved") {
      return { href: returnTo, label: "Back to saved" };
    }
    const m = returnTo.match(/^\/properties\/(rent|sale|villas|land|business)(?:\/([^/?]+))?/);
    if (m) {
      const slug = m[1];
      const areaSlug = m[2];
      const t = TYPE_LABEL[slug] ?? slug;
      if (areaSlug && areas[areaSlug as keyof typeof areas]) {
        const name = areas[areaSlug as keyof typeof areas].nameEn;
        return { href: returnTo, label: `Back to ${name} · ${t}` };
      }
      return { href: returnTo, label: `Back to ${t}` };
    }
    return { href: returnTo, label: "Back to listings" };
  }

  const fallback = defaultListingPathForProperty(property);
  const pathOnly = fallback.split("?")[0];
  if (pathOnly === "/properties/villas") {
    return { href: fallback, label: "Back to all villas" };
  }
  if (pathOnly === "/properties/land") {
    return { href: fallback, label: "Back to land" };
  }
  if (pathOnly === "/properties/business") {
    return { href: fallback, label: "Back to business" };
  }
  if (pathOnly.startsWith("/properties/land/")) {
    const a = pathOnly.replace("/properties/land/", "");
    const name = areas[a as keyof typeof areas]?.nameEn ?? a;
    return { href: fallback, label: `Back to land in ${name}` };
  }
  if (pathOnly.startsWith("/properties/business/")) {
    const a = pathOnly.replace("/properties/business/", "");
    const name = areas[a as keyof typeof areas]?.nameEn ?? a;
    return { href: fallback, label: `Back to business in ${name}` };
  }
  return { href: fallback, label: "Back to listings" };
}

/** Pass as viewReturnPath on cards opened from this property's "Similar" row. */
export function similarSectionReturnPath(property: Property, returnTo: string | null): string {
  return returnTo ?? defaultListingPathForProperty(property);
}
