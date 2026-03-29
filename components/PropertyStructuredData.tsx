import { Property } from "@/types/property";
import { featureIsYes } from "@/lib/featureState";
import { areas } from "@/types/areas";

interface PropertyStructuredDataProps {
  property: Property;
  baseUrl: string;
  propertyUrl: string;
}

export default function PropertyStructuredData({ property, baseUrl, propertyUrl }: PropertyStructuredDataProps) {
  const areaInfo = property.mainArea ? areas[property.mainArea] : null;
  const areaName = areaInfo?.nameEn || property.mainArea || "Bali";
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

  const address = {
    "@type": "PostalAddress" as const,
    addressLocality: areaName,
    addressRegion: "Bali",
    addressCountry: "ID",
  };

  // Product schema (for rich results / shopping)
  const productOffers =
    isSale && forSale != null
      ? {
          "@type": "Offer" as const,
          price: forSale,
          priceCurrency: p.currency || "IDR",
          availability: property.archived ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
          url: propertyUrl,
        }
      : monthly != null
        ? {
            "@type": "Offer" as const,
            price: monthly,
            priceCurrency: p.currency || "IDR",
            priceSpecification: {
              "@type": "UnitPriceSpecification" as const,
              price: monthly,
              priceCurrency: p.currency || "IDR",
              unitCode: "MON",
              valueAddedTaxIncluded: true,
            },
            availability: property.archived ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
            url: propertyUrl,
          }
        : undefined;

  const product: Record<string, unknown> = {
    "@type": "Product",
    name: displayTitle,
    description: property.description || `${displayTitle} in ${areaName}`,
    image: property.images?.map(toAbsoluteUrl) || [],
    address,
    numberOfRooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms ?? property.bedrooms,
  };
  if (productOffers) product.offers = productOffers;

  // Accommodation schema (for real estate / lodging)
  const amenityFeature: { "@type": string; name: string }[] = [];
  if (featureIsYes(property.features.pool)) amenityFeature.push({ "@type": "LodgingAmenityFeature", name: "Pool" });
  if (featureIsYes(property.features.highSpeedWifi)) amenityFeature.push({ "@type": "LodgingAmenityFeature", name: "WiFi" });
  if (featureIsYes(property.features.bathtub)) amenityFeature.push({ "@type": "LodgingAmenityFeature", name: "Bathtub" });
  if (featureIsYes(property.features.carPark)) amenityFeature.push({ "@type": "LodgingAmenityFeature", name: "Parking" });
  if (featureIsYes(property.features.washingMachine)) amenityFeature.push({ "@type": "LodgingAmenityFeature", name: "Washing machine" });
  if (featureIsYes(property.features.natureView)) amenityFeature.push({ "@type": "LodgingAmenityFeature", name: "Nature view" });

  const accommodationOffers =
    isSale && forSale != null
      ? { "@type": "Offer" as const, price: forSale, priceCurrency: p.currency || "IDR", url: propertyUrl }
      : monthly != null
        ? {
            "@type": "Offer" as const,
            price: monthly,
            priceCurrency: p.currency || "IDR",
            priceSpecification: {
              "@type": "UnitPriceSpecification" as const,
              unitCode: "MON",
              price: monthly,
              priceCurrency: p.currency || "IDR",
            },
            url: propertyUrl,
          }
        : undefined;

  const accommodation: Record<string, unknown> = {
    "@type": "Accommodation",
    name: displayTitle,
    description: property.description || `${displayTitle} in ${areaName}`,
    image: property.images?.map(toAbsoluteUrl) || [],
    address,
    numberOfRooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms ?? property.bedrooms,
  };
  if (amenityFeature.length > 0) accommodation.amenityFeature = amenityFeature;
  if (accommodationOffers) accommodation.offers = accommodationOffers;

  const graph = {
    "@context": "https://schema.org",
    "@graph": [product, accommodation],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
