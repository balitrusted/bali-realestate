import { Property } from "@/types/property";

interface CatalogStructuredDataProps {
  properties: Property[];
  baseUrl: string;
  listName?: string;
}

export default function CatalogStructuredData({
  properties,
  baseUrl,
  listName = "Bali Properties",
}: CatalogStructuredDataProps) {
  if (properties.length === 0) return null;

  const itemListElement = properties.map((p, index) => ({
    "@type": "ListItem" as const,
    position: index + 1,
    url: `${baseUrl}/properties/view/${p.id}`,
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
