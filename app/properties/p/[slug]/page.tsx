import { notFound } from "next/navigation";
import { loadAllPropertiesForSlugIndex } from "@/lib/propertiesCatalog";
import { buildPropertySlugIndex } from "@/lib/propertySlug";
import { sanitizeReturnTo } from "@/lib/propertyViewNavigation";
import PropertyDetailView from "@/components/PropertyDetailView";
import { buildPropertyPageMetadata } from "@/lib/propertyMetadata";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const all = await loadAllPropertiesForSlugIndex();
  const idx = buildPropertySlugIndex(all);
  const property = idx.bySlugSegment(slug);
  if (!property) {
    return { title: "Property Not Found" };
  }
  return buildPropertyPageMetadata(property, all);
}

export default async function PropertyBySlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const all = await loadAllPropertiesForSlugIndex();
  const idx = buildPropertySlugIndex(all);
  const property = idx.bySlugSegment(slug);
  if (!property) {
    notFound();
  }
  const returnToFromQuery = sanitizeReturnTo(sp.returnTo);
  return <PropertyDetailView property={property} all={all} returnToFromQuery={returnToFromQuery} />;
}
