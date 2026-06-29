import type { Metadata } from "next";
import type { Property } from "@/types/property";
import { areas } from "@/types/areas";
import { buildPropertySlugIndex } from "@/lib/propertySlug";
import { getPropertyDisplayTitle, fixDescriptionDisplay } from "@/lib/propertyUtils";

function siteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || "https://balitrusted.com").replace(/\/$/, "");
}

/** Absolute URL for Open Graph / WhatsApp preview image. */
export function propertyShareImageUrl(property: Property, baseUrl = siteBaseUrl()): string | undefined {
  const raw = property.images?.find((u) => typeof u === "string" && u.trim().length > 0)?.trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${baseUrl}${raw}`;
  return `${baseUrl}/${raw}`;
}

export function buildPropertyPageMetadata(
  property: Property,
  allForSlugs: Property[]
): Metadata {
  const baseUrl = siteBaseUrl();
  const canonicalPath = buildPropertySlugIndex(allForSlugs).pathFor(property);
  const canonicalUrl = `${baseUrl}${canonicalPath}`;
  const areaInfo = property.mainArea ? areas[property.mainArea] : null;
  const areaName = areaInfo?.nameEn || property.mainArea || "Bali";
  const displayTitle = getPropertyDisplayTitle(property);
  const title = `${displayTitle} - ${areaName}`;
  const description = fixDescriptionDisplay(property.description || "").substring(0, 160);
  const imageUrl = propertyShareImageUrl(property, baseUrl);

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "Balitrusted",
      ...(imageUrl
        ? {
            images: [
              {
                url: imageUrl,
                alt: displayTitle,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}
