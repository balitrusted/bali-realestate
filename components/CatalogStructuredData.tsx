import { Property } from "@/types/property";
import { buildPropertySlugIndex } from "@/lib/propertySlug";

interface CatalogStructuredDataProps {
  properties: Property[];
  baseUrl: string;
  listName?: string;
  /** Same list as used for catalog (non-archived); used to build SEO URLs */
  allPropertiesForSlugs: Property[];
}

export default function CatalogStructuredData({
  properties,
  baseUrl,
  listName = "Bali Properties",
  allPropertiesForSlugs,
}: CatalogStructuredDataProps) {
  if (properties.length === 0) return null;

  const slugIndex = buildPropertySlugIndex(allPropertiesForSlugs);
  const root = baseUrl.replace(/\/$/, "");

  const itemListElement = properties.map((p, index) => ({
    "@type": "ListItem" as const,
    position: index + 1,
    url: `${root}${slugIndex.pathFor(p)}`,
    name: p.title || `Villa ${p.villaNumber || p.id}`,
  }));

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    numberOfItems: properties.length,
    itemListElement,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
