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

// Quick UI switch (easy rollback):
// - "above": title + key info above the image (copy-friendly)
// - "overlay": title + key info over the image (previous variant 1)
// - "below": title below the image (original variant 0)
const PROPERTY_CARD_TITLE_VARIANT: "above" | "overlay" | "below" = "above";

export default function PropertyCard({ property }: PropertyCardProps) {
  const formatPrice = (price: number, currency: string) => {
    if (currency === "IDR") {
      return `${(price / 1000000).toFixed(0)}M IDR`;
    }
    return `$${price.toLocaleString()}`;
  };

  const mainAreaLabel = property.mainArea ? (areas[property.mainArea]?.nameEn || property.mainArea) : null;

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
  if (property.features.bathtub) featuresList.push("bathtub");
  if (property.features.carPark) featuresList.push("car park");
  if (property.features.closedKitchen) featuresList.push("closed kitchen");
  if (property.features.desk) featuresList.push("desk");
  if (property.features.enclosedLivingArea) featuresList.push("enclosed living");
  if (property.features.garage) featuresList.push("garage");
  if (property.features.highSpeedWifi) featuresList.push("high-speed WiFi");
  if (property.features.natureView) featuresList.push("nature view");
  if (property.features.petFriendly) featuresList.push("pet friendly");
  if (property.features.pool) featuresList.push("pool");
  if (property.features.washingMachine) featuresList.push("washing machine");

  const mainImage = property.images && property.images.length > 0 
    ? property.images[0] 
    : null;
  const displayTitle = getPropertyDisplayTitle(property);
  const cardTitle =
    property.villaNumber && property.bedrooms
      ? `Villa #${property.villaNumber} · ${property.bedrooms} ${property.bedrooms === 1 ? "bed" : "beds"}`
      : displayTitle;

  const locationLabel = [
    property.mainArea ? (areas[property.mainArea]?.nameEn || property.mainArea) : null,
    property.subArea != null ? (subAreaNames[property.subArea] || property.subArea) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const primaryPriceText =
    forSale != null && isSale
      ? `${formatPrice(forSale, p.currency)} · for sale`
      : hasYearlyOnly && yearly != null && yearly > 0
        ? `${formatPrice(yearly, p.currency)} / year`
        : monthly != null && monthly > 0
          ? `${formatPrice(monthly, p.currency)} / month`
          : null;

  const topSubline = locationLabel || null;

  const href = `/properties/view/${property.id}`;

  return (
    <article className="flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {PROPERTY_CARD_TITLE_VARIANT === "above" && (
        <div className="p-5 pb-3">
          <h3 className="text-xl font-semibold text-gray-900 leading-snug select-text">
            <Link href={href} className="hover:underline underline-offset-2">
              {cardTitle}
            </Link>
          </h3>
          {topSubline && (
            <p className="mt-1 text-sm text-gray-600 select-text">
              {topSubline}
            </p>
          )}
        </div>
      )}

      {/* Image */}
      {mainImage ? (
        <div className="w-full h-48 relative overflow-hidden flex-shrink-0">
          <Link href={href} className="absolute inset-0" aria-label={displayTitle}>
            <PropertyImageWithFallback
              src={mainImage}
              alt={getPropertyImageAlt(property, 0)}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </Link>
          {PROPERTY_CARD_TITLE_VARIANT === "overlay" && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/55 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <div className="text-white">
                  <div className="text-sm font-semibold leading-snug line-clamp-2 drop-shadow">
                    {displayTitle}
                  </div>
                  <div className="mt-0.5 text-xs text-white/90 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    {locationLabel ? <span className="drop-shadow">{locationLabel}</span> : null}
                    {primaryPriceText ? (
                      <>
                        <span className="text-white/70">·</span>
                        <span className="drop-shadow">{primaryPriceText}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )}
          <PropertyCardActions propertyId={String(property.id)} />
        </div>
      ) : (
        <div className="w-full h-48 relative bg-gray-200 flex items-center justify-center flex-shrink-0">
          <span className="text-gray-400">Property Photo</span>
          <PropertyCardActions propertyId={String(property.id)} />
        </div>
      )}

      <div className={`${PROPERTY_CARD_TITLE_VARIANT === "above" ? "px-6 pt-4 pb-6" : "p-6"} flex flex-col flex-1 min-h-0`}>
        {PROPERTY_CARD_TITLE_VARIANT === "below" && (
          <h3 className="text-xl font-semibold text-gray-900 mb-2 select-text">
            <Link href={href} className="hover:underline underline-offset-2">
              {displayTitle}
            </Link>
          </h3>
        )}
        
        {property.description?.trim() && (
          <p className="text-gray-600 mb-4 line-clamp-2 select-text">
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

        <div className="mt-auto pt-2">
          {/* Keep price aligned across cards */}
          <div className="min-h-[56px] mb-3">
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
          </div>

          <Link
            href={href}
            className="block text-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
