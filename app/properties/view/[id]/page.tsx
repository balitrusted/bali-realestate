import { notFound, permanentRedirect } from "next/navigation";
import { loadFullPropertyList } from "@/lib/propertiesStorage";
import { loadAllPropertiesForSlugIndex } from "@/lib/propertiesCatalog";
import { buildPropertySlugIndex } from "@/lib/propertySlug";
import { areas } from "@/types/areas";
import { getPropertyDisplayTitle, fixDescriptionDisplay } from "@/lib/propertyUtils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getPropertyById(id: string) {
  try {
    const properties = await loadFullPropertyList();
    return properties.find((p) => p.id === id) || null;
  } catch (error) {
    console.error("Error loading property:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) {
    return { title: "Property Not Found" };
  }
  const all = await loadAllPropertiesForSlugIndex();
  const canonicalPath = buildPropertySlugIndex(all).pathFor(property);
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
  const areaInfo = property.mainArea ? areas[property.mainArea] : null;
  const areaName = areaInfo?.nameEn || property.mainArea || "Bali";
  const displayTitle = getPropertyDisplayTitle(property);
  return {
    title: `${displayTitle} - ${areaName}`,
    description: fixDescriptionDisplay(property.description || "").substring(0, 160),
    alternates: { canonical: `${baseUrl}${canonicalPath}` },
  };
}

/** Legacy `/properties/view/[id]` → canonical `/properties/{slug}` */
export default async function LegacyPropertyViewRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) {
    notFound();
  }
  const all = await loadAllPropertiesForSlugIndex();
  const path = buildPropertySlugIndex(all).pathFor(property);
  permanentRedirect(path);
}
