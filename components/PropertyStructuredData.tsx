import { Property } from "@/types/property";
import { featureIsYes } from "@/lib/featureState";
import { areas } from "@/types/areas";
import { getPropertyDisplayTitle } from "@/lib/propertyUtils";
import { parseLatLng } from "@/lib/mapGeo";

interface PropertyStructuredDataProps {
  property: Property;
  baseUrl: string;
  propertyUrl: string;
}

const BALITRUSTED_BRAND = { "@type": "Brand" as const, name: "Balitrusted" };

/** Google merchant-listing hints on Offer (inquiry-based long-stay; not parcel e-commerce). */
function offerMerchantFields(baseUrl: string) {
  const root = baseUrl.replace(/\/$/, "");
  return {
    seller: {
      "@type": "Organization" as const,
      name: "Balitrusted",
      url: root,
    },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy" as const,
      applicableCountry: "ID",
      returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
      url: `${root}/request`,
    },
    shippingDetails: {
      "@type": "OfferShippingDetails" as const,
      shippingRate: {
        "@type": "MonetaryAmount" as const,
        value: "0",
        currency: "IDR",
      },
      shippingDestination: {
        "@type": "DefinedRegion" as const,
        addressCountry: "ID",
      },
      deliveryTime: {
        "@type": "ShippingDeliveryTime" as const,
        handlingTime: {
          "@type": "QuantitativeValue" as const,
          minValue: 0,
          maxValue: 0,
          unitCode: "DAY",
        },
        transitTime: {
          "@type": "QuantitativeValue" as const,
          minValue: 0,
          maxValue: 0,
          unitCode: "DAY",
        },
      },
    },
  };
}

export default function PropertyStructuredData({ property, baseUrl, propertyUrl }: PropertyStructuredDataProps) {
  const areaInfo = property.mainArea ? areas[property.mainArea as keyof typeof areas] : null;
  const areaName = areaInfo?.nameEn || property.mainArea || "Bali";
  const displayTitle = getPropertyDisplayTitle(property);

  const p = property.price;
  const monthly = p.monthly ?? p.min;
  const yearly = p.yearly;
  const forSale = p.forSale;
  const isSale = property.types?.includes("sale");
  const extraOffer = offerMerchantFields(baseUrl);

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

  const amenityFeature: { "@type": string; name: string }[] = [];
  if (featureIsYes(property.features.pool)) amenityFeature.push({ "@type": "LodgingAmenityFeature", name: "Pool" });
  if (featureIsYes(property.features.highSpeedWifi)) amenityFeature.push({ "@type": "LodgingAmenityFeature", name: "WiFi" });
  if (featureIsYes(property.features.bathtub)) amenityFeature.push({ "@type": "LodgingAmenityFeature", name: "Bathtub" });
  if (featureIsYes(property.features.carPark)) amenityFeature.push({ "@type": "LodgingAmenityFeature", name: "Parking" });
  if (featureIsYes(property.features.washingMachine)) amenityFeature.push({ "@type": "LodgingAmenityFeature", name: "Washing machine" });
  if (featureIsYes(property.features.natureView)) amenityFeature.push({ "@type": "LodgingAmenityFeature", name: "Nature view" });

  let accommodationOffers: Record<string, unknown> | undefined;
  if (isSale && forSale != null) {
    accommodationOffers = {
      "@type": "Offer" as const,
      price: forSale,
      priceCurrency: p.currency || "IDR",
      url: propertyUrl,
      availability: property.archived ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      ...extraOffer,
    };
  } else if (monthly != null && monthly > 0) {
    accommodationOffers = {
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
      availability: property.archived ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      ...extraOffer,
    };
  } else if (yearly != null && yearly > 0) {
    accommodationOffers = {
      "@type": "Offer" as const,
      price: yearly,
      priceCurrency: p.currency || "IDR",
      priceSpecification: {
        "@type": "UnitPriceSpecification" as const,
        price: yearly,
        priceCurrency: p.currency || "IDR",
        unitText: "year",
      },
      url: propertyUrl,
      availability: property.archived ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      ...extraOffer,
    };
  }

  const coords = parseLatLng(property.displayLocation);

  const accommodation: Record<string, unknown> = {
    "@type": "Accommodation",
    "@id": `${propertyUrl}#accommodation`,
    name: displayTitle,
    description: property.description || `${displayTitle} in ${areaName}`,
    image: property.images?.map(toAbsoluteUrl) || [],
    address,
    brand: BALITRUSTED_BRAND,
    identifier: property.id,
    numberOfRooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms ?? property.bedrooms,
    url: propertyUrl,
  };

  if (coords) {
    const [lat, lng] = coords;
    accommodation.latitude = lat;
    accommodation.longitude = lng;
    accommodation.geo = {
      "@type": "GeoCoordinates",
      latitude: lat,
      longitude: lng,
    };
  }

  if (amenityFeature.length > 0) accommodation.amenityFeature = amenityFeature;
  if (accommodationOffers) accommodation.offers = accommodationOffers;

  const graph = {
    "@context": "https://schema.org",
    "@graph": [accommodation],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
