import Link from "next/link";
import PropertyImageWithFallback from "@/components/PropertyImageWithFallback";
import PropertyCardActions from "@/components/PropertyCardActions";
import { Property } from "@/types/property";
import { areas, subAreaNames, SUBAREA_UNSPECIFIED_LABEL } from "@/types/areas";
import { getPropertyDisplayTitle, fixDescriptionDisplay } from "@/lib/propertyUtils";
import { getPropertyImageAlt } from "@/lib/imageSeo";

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const formatPrice = (price: number, currency: string) => {
    if (currency === "IDR") {
      return `${(price / 1000000).toFixed(0)}M IDR`;
    }
    return `$${price.toLocaleString()}`;
  };

  const p = property.price;
  const monthly = p.monthly ?? p.min;
  const yearly = p.yearly;
  const forSale = p.forSale;
  const isSale = property.types?.includes("sale");
  const hasYearlyOnly = (yearly != null && yearly > 0) && (monthly == null || monthly === 0);
  const hasDiscount = monthly != null && yearly != null && monthly > 0 && yearly < monthly * 12;
  const discountPercent = hasDiscount
    ? Math.round(((monthly * 12 - yearly) / (monthly * 12)) * 100)
    : 0;

  // All features from import (same order as in CSV/admin)
  const featuresList: string[] = [];
  if (property.features.bathtub) featuresList.push("Bathtub");
  if (property.features.carPark) featuresList.push("Car park");
  if (property.features.closedKitchen) featuresList.push("Closed kitchen");
  if (property.features.desk) featuresList.push("Desk");
  if (property.features.enclosedLivingArea) featuresList.push("Enclosed living");
  if (property.features.garage) featuresList.push("Garage");
  if (property.features.highSpeedWifi) featuresList.push("High-speed WiFi");
  if (property.features.natureView) featuresList.push("Nature view");
  if (property.features.petFriendly) featuresList.push("Pet friendly");
  if (property.features.pool) featuresList.push("Pool");
  if (property.features.washingMachine) featuresList.push("Washing machine");

  const mainImage = property.images && property.images.length > 0 
    ? property.images[0] 
    : null;
  const displayTitle = getPropertyDisplayTitle(property);

  return (
    <Link 
      href={`/properties/view/${property.id}`}
      className="flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Image */}
      {mainImage ? (
        <div className="w-full h-48 relative overflow-hidden flex-shrink-0">
          <PropertyImageWithFallback
            src={mainImage}
            alt={getPropertyImageAlt(property, 0)}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <PropertyCardActions propertyId={String(property.id)} />
        </div>
      ) : (
        <div className="w-full h-48 relative bg-gray-200 flex items-center justify-center flex-shrink-0">
          <span className="text-gray-400">Property Photo</span>
          <PropertyCardActions propertyId={String(property.id)} />
        </div>
      )}

      <div className="p-6 flex flex-col flex-1 min-h-0">
        {/* Area & sub-area in a column */}
        <div className="flex flex-col gap-0.5 mb-3 text-sm text-gray-600">
          <span>
            <span className="text-gray-500">Area: </span>
            {property.mainArea ? (areas[property.mainArea]?.nameEn || property.mainArea) : "—"}
          </span>
          <span>
            <span className="text-gray-500">Sub-area: </span>
            {property.subArea != null ? (subAreaNames[property.subArea] || property.subArea) : SUBAREA_UNSPECIFIED_LABEL}
          </span>
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {displayTitle}
        </h3>
        
        {property.description?.trim() && (
          <p className="text-gray-600 mb-4 line-clamp-2">
            {fixDescriptionDisplay(property.description)}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
            {property.bedrooms} {property.bedrooms === 1 ? "bedroom" : "bedrooms"}
          </span>
          {property.bathrooms != null && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
              {property.bathrooms} {property.bathrooms === 1 ? "bath" : "baths"}
            </span>
          )}
          {featuresList.map((feature, idx) => (
            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
              {feature}
            </span>
          ))}
        </div>

        <div className="mb-4">
          {forSale != null && isSale && (
            <p className="text-lg font-semibold text-gray-900">
              {formatPrice(forSale, p.currency)}
              <span className="text-sm font-normal text-gray-500 ml-1">· for sale</span>
            </p>
          )}
          {(monthly != null && monthly > 0) || hasYearlyOnly ? (
            <div className={forSale != null && isSale ? "mt-1" : ""}>
              {!hasYearlyOnly && monthly != null && monthly > 0 && (
                <>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatPrice(monthly, p.currency)}
                    <span className="text-sm font-normal text-gray-500 ml-1">/ month</span>
                  </p>
                  {yearly != null && yearly > 0 && (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <p className="text-sm text-gray-600">
                        {formatPrice(yearly, p.currency)} / year
                      </p>
                      {hasDiscount && discountPercent > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                          Save {discountPercent}%
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
              {hasYearlyOnly && yearly != null && yearly > 0 && (
                <p className="text-lg font-semibold text-gray-900">
                  {formatPrice(yearly, p.currency)}
                  <span className="text-sm font-normal text-gray-500 ml-1">/ year</span>
                </p>
              )}
            </div>
          ) : null}
          {property.duration && (
            <p className="text-sm text-gray-600 mt-1">
              Minimum duration: {property.duration.min} {property.duration.min === 1 ? 'month' : 'months'}
            </p>
          )}
        </div>

        <div className="mt-auto pt-2">
          <div className="text-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors">
            View Details
          </div>
        </div>
      </div>
    </Link>
  );
}
