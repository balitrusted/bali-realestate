import type { Property } from "@/types/property";
import { findSimilarProperties } from "@/lib/similarProperties";
import { getPropertyBackNavigation, similarSectionReturnPath } from "@/lib/propertyViewNavigation";
import PropertyBackNav from "@/components/PropertyBackNav";
import PropertyImages from "@/components/PropertyImages";
import NotifyWhenAvailableForm from "@/components/NotifyWhenAvailableForm";
import PropertyLocationMap from "@/components/PropertyLocationMap";
import PropertyStructuredData from "@/components/PropertyStructuredData";
import PropertyCardActions from "@/components/PropertyCardActions";
import PropertyDetailSimilar from "@/components/PropertyDetailSimilar";
import PropertyDetailLeadButtons from "@/components/PropertyDetailLeadButtons";
import { subAreaNames, areas, SUBAREA_UNSPECIFIED_LABEL } from "@/types/areas";
import { getPropertyDisplayTitle, fixDescriptionDisplay, fixVillaNumberDisplay } from "@/lib/propertyUtils";
import { buildPropertySlugIndex } from "@/lib/propertySlug";
import { formatLocaleDate } from "@/lib/formatDate";

type Props = {
  property: Property;
  all: Property[];
  returnToFromQuery: string | null;
};

export default function PropertyDetailView({ property, all, returnToFromQuery }: Props) {
  const slugIndex = buildPropertySlugIndex(all);
  const canonicalPath = slugIndex.pathFor(property);
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
  const propertyUrl = `${baseUrl}${canonicalPath}`;

  const fallbackBackNav = getPropertyBackNavigation(property, null);
  const similar = findSimilarProperties(property, all, 12);
  const similarReturnPath = similarSectionReturnPath(property, returnToFromQuery);
  const similarItems = similar.map((p) => ({
    property: p,
    detailSlug: slugIndex.segmentFor(p),
  }));

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
  const hasDiscount = monthly != null && yearly != null && monthly > 0 && yearly < monthly * 12;
  const discountPercent = hasDiscount
    ? Math.round(((monthly * 12 - yearly) / (monthly * 12)) * 100)
    : 0;

  const featuresList: string[] = [];
  if (property.features.bathtub) featuresList.push("bathtub");
  if (property.features.carPark) featuresList.push("car park");
  if (property.features.closedKitchen) featuresList.push("closed kitchen");
  if (property.features.desk) featuresList.push("desk");
  if (property.features.enclosedLivingArea) featuresList.push("enclosed living area");
  if (property.features.garage) featuresList.push("garage");
  if (property.features.highSpeedWifi) featuresList.push("high-speed WiFi");
  if (property.features.natureView) featuresList.push("nature view");
  if (property.features.petFriendly) featuresList.push("pet friendly");
  if (property.features.pool) featuresList.push("pool");
  if (property.features.washingMachine) featuresList.push("washing machine");

  const areaInfo = property.mainArea ? areas[property.mainArea] : null;
  const types = property.types ?? [];
  const hasRent = types.includes("rent");
  const hasSale = types.includes("sale");
  const hasLand = types.includes("land");
  const hasBusiness = types.includes("business");
  const showAvailability = hasRent && !hasLand && !hasBusiness;
  const dealLabel = hasRent ? "Rent" : hasSale ? "Buy" : hasLand ? "Land" : hasBusiness ? "Business" : "Listing";
  const headingTitle = (() => {
    const beds = property.bedrooms ?? 0;
    const bedLabel = beds === 1 ? "1 bed" : `${beds} bed`;
    if (property.villaNumber?.trim?.()) {
      const num = fixVillaNumberDisplay(property.villaNumber).trim().replace(/^#/, "");
      return `Villa #${num} · ${bedLabel} · ${dealLabel}`;
    }
    const explicitTitle = property.title?.trim();
    if (explicitTitle) return `${explicitTitle} · ${dealLabel}`;
    return `${bedLabel} villa · ${dealLabel}`;
  })();
  const locationLabel = `${areaInfo?.nameEn || "Area"} • ${
    property.subArea != null
      ? subAreaNames[property.subArea] || property.subArea
      : SUBAREA_UNSPECIFIED_LABEL
  }`;

  return (
    <>
      <PropertyStructuredData property={property} baseUrl={baseUrl} propertyUrl={propertyUrl} />
      <div className="bg-white min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {property.archived && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-wrap items-center gap-3">
              <span className="font-medium text-amber-800">This villa is currently not available.</span>
              <span className="text-amber-700 text-sm">
                It may become available again later. Use the form below to get notified.
              </span>
            </div>
          )}
          <PropertyBackNav
            property={property}
            returnToFromQuery={returnToFromQuery}
            fallbackNav={fallbackBackNav}
          />

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <div>
              <PropertyImages
                images={property.images || []}
                title={getPropertyDisplayTitle(property)}
                property={property}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <h1 className="text-3xl font-bold text-gray-900 flex-1 min-w-0 pr-2">
                  {headingTitle}
                </h1>
                <PropertyCardActions propertyId={String(property.id)} layout="inline" />
              </div>

              <div className="mb-4 text-sm text-gray-500">
                <span>{locationLabel}</span>
              </div>

              <div className="mb-5">
                {forSale != null && isSale && (
                  <p className="text-3xl font-semibold text-gray-900">
                    {formatPrice(forSale, p.currency)}
                    <span className="text-lg font-normal text-gray-500 ml-2">· for sale</span>
                  </p>
                )}
                {monthly != null && monthly > 0 && (
                  <>
                    {forSale != null && isSale && <div className="mt-2" />}
                    <p className="text-3xl font-semibold text-gray-900">
                      {formatPrice(monthly, p.currency)}
                      <span className="text-lg font-normal text-gray-500 ml-2">/ month</span>
                    </p>
                    {yearly != null && (
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <p className="text-lg text-gray-700">{formatPrice(yearly, p.currency)} / year</p>
                        {hasDiscount && discountPercent > 0 && (
                          <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-emerald-100 text-emerald-800">
                            Save {discountPercent}%
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
                {showAvailability && (
                  <div className="mt-3">
                    <span className="inline-flex items-center rounded-md border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-700">
                      Available: {property.availableFrom ? formatLocaleDate(property.availableFrom) : "Now"}
                    </span>
                  </div>
                )}
              </div>

              {property.description?.trim() && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                  <div className="text-gray-700 whitespace-pre-line">
                    {fixDescriptionDisplay(property.description)}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Bedrooms</span>
                    <p className="text-lg font-semibold text-gray-900">{property.bedrooms}</p>
                  </div>
                  {property.bathrooms && (
                    <div>
                      <span className="text-sm text-gray-600">Bathrooms</span>
                      <p className="text-lg font-semibold text-gray-900">{property.bathrooms}</p>
                    </div>
                  )}
                </div>
              </div>

              {featuresList.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Features</h2>
                  <div className="flex flex-wrap gap-2">
                    {featuresList.map((feature, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Location</h2>
                <PropertyLocationMap
                  title={headingTitle}
                  areaLabel={locationLabel}
                  displayLocation={property.displayLocation}
                  exactLocation={property.exactLocation}
                />
              </div>

              {property.archived ? (
                <NotifyWhenAvailableForm
                  propertyId={property.id}
                  propertyTitle={getPropertyDisplayTitle(property)}
                />
              ) : (
                <PropertyDetailLeadButtons
                  propertyId={String(property.id)}
                  propertyTitle={getPropertyDisplayTitle(property)}
                  propertyPageUrl={propertyUrl}
                  hasRent={hasRent}
                  hasSale={hasSale}
                  hasLand={hasLand}
                  hasBusiness={hasBusiness}
                  archived={false}
                />
              )}
            </div>
          </div>

          <PropertyDetailSimilar items={similarItems} viewReturnPath={similarReturnPath} />
        </div>
      </div>
    </>
  );
}
