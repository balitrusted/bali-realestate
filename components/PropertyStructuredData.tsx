import { Property } from "@/types/property";
import { areas } from "@/types/areas";

interface PropertyStructuredDataProps {
  property: Property;
  baseUrl: string;
}

export default function PropertyStructuredData({ property, baseUrl }: PropertyStructuredDataProps) {
  const areaInfo = property.mainArea ? areas[property.mainArea] : null;
  const areaName = areaInfo?.nameEn || property.mainArea || 'Bali';
  const displayTitle = property.title || `Villa ${property.villaNumber || property.id}`;
  
  const p = property.price;
  const monthly = p.monthly ?? p.min;
  const yearly = p.yearly;
  const forSale = p.forSale;
  const isSale = property.types?.includes("sale");
  
  const toAbsoluteUrl = (u: string) => {
    if (!u) return u;
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
    return `${baseUrl}${u.startsWith("/") ? "" : "/"}${u}`;
  };

  const mainImage = property.images && property.images.length > 0
    ? toAbsoluteUrl(property.images[0])
    : undefined;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": displayTitle,
    "description": property.description || `${displayTitle} in ${areaName}`,
    "image": property.images?.map(toAbsoluteUrl) || [],
    "offers": isSale && forSale != null ? {
      "@type": "Offer",
      "price": forSale,
      "priceCurrency": p.currency || "IDR",
      "availability": property.archived ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
      "url": `${baseUrl}/properties/view/${property.id}`,
    } : (monthly != null ? {
      "@type": "Offer",
      "price": monthly,
      "priceCurrency": p.currency || "IDR",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": monthly,
        "priceCurrency": p.currency || "IDR",
        "unitCode": "MON",
        "valueAddedTaxIncluded": true,
      },
      "availability": property.archived ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
      "url": `${baseUrl}/properties/view/${property.id}`,
    } : undefined),
    "address": {
      "@type": "PostalAddress",
      "addressLocality": areaName,
      "addressRegion": "Bali",
      "addressCountry": "ID",
    },
    "numberOfRooms": property.bedrooms,
    "numberOfBathroomsTotal": property.bathrooms || property.bedrooms,
  };

  // Remove undefined offers
  if (!structuredData.offers) {
    delete structuredData.offers;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
