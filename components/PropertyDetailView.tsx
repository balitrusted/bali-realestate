import type { Property } from "@/types/property";
import { featureIsYes } from "@/lib/featureState";
import { findSimilarProperties } from "@/lib/similarProperties";
import { getPropertyBackNavigation, similarSectionReturnPath } from "@/lib/propertyViewNavigation";
import Link from "next/link";
import PropertyBackNav, { PropertyNavLink } from "@/components/PropertyBackNav";
import PropertyLocationLinks from "@/components/PropertyLocationLinks";
import PropertyImages from "@/components/PropertyImages";
import NotifyWhenAvailableForm from "@/components/NotifyWhenAvailableForm";
import PropertyLocationMap from "@/components/PropertyLocationMap";
import PropertyStructuredData from "@/components/PropertyStructuredData";
import PropertyCardActions from "@/components/PropertyCardActions";
import PropertyDetailSimilar from "@/components/PropertyDetailSimilar";
import PropertyDetailLeadButtons from "@/components/PropertyDetailLeadButtons";
import PriceText from "@/components/PriceText";
import { subAreaNames, areas, SUBAREA_UNSPECIFIED_LABEL } from "@/types/areas";
import { resolveAreaLabel } from "@/lib/mainAreaRegistry";
import { subAreaBrowseLinkLabel, subAreaCatalogHref } from "@/lib/propertyCatalogLinks";
import {
  getPropertyDisplayTitle,
  fixDescriptionDisplay,
  fixVillaNumberDisplay,
  isPureLandListing,
} from "@/lib/propertyUtils";
import { buildPropertySlugIndex } from "@/lib/propertySlug";
import { formatLocaleDate } from "@/lib/formatDate";
import { normalizeAvailableFrom } from "@/lib/availability";

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
  if (featureIsYes(property.features.bathtub)) featuresList.push("bathtub");
  if (featureIsYes(property.features.carPark)) featuresList.push("car park");
  if (featureIsYes(property.features.closedKitchen)) featuresList.push("closed kitchen");
  if (featureIsYes(property.features.desk)) featuresList.push("desk");
  if (featureIsYes(property.features.enclosedLivingArea)) featuresList.push("enclosed living area");
  if (featureIsYes(property.features.garage)) featuresList.push("garage");
  if (featureIsYes(property.features.highSpeedWifi)) featuresList.push("high-speed WiFi");
  if (featureIsYes(property.features.natureView)) featuresList.push("nature view");
  if (featureIsYes(property.features.petFriendly)) featuresList.push("pet friendly");
  if (featureIsYes(property.features.pool)) featuresList.push("pool");
  if (featureIsYes(property.features.washingMachine)) featuresList.push("washing machine");

  const areaInfo = property.mainArea
    ? areas[property.mainArea as keyof typeof areas]
    : null;
  const areaLabel = property.mainArea
    ? areaInfo?.nameEn ?? resolveAreaLabel(property.mainArea)
    : "Area";
  const types = property.types ?? [];
  const hasRent = types.includes("rent");
  const hasSale = types.includes("sale");
  const hasLand = types.includes("land");
  const hasBusiness = types.includes("business");
  const showAvailability = hasRent && !hasLand && !hasBusiness;
  const availableFrom = normalizeAvailableFrom(property.availableFrom ?? undefined);
  const dealLabel = hasRent ? "Rent" : hasSale ? "Buy" : hasLand ? "Land" : hasBusiness ? "Business" : "Listing";
  const headingTitle = (() => {
    if (isPureLandListing(property) && property.villaNumber?.trim?.()) {
      const num = fixVillaNumberDisplay(property.villaNumber).trim().replace(/^#/, "");
      return `Land #${num}`;
    }
    const beds = property.bedrooms ?? 0;
    const bedLabel = beds === 1 ? "1 bed" : `${beds} bed`;
    const showBeds = !hasLand || hasRent || hasSale || hasBusiness;
    if (property.villaNumber?.trim?.()) {
      const num = fixVillaNumberDisplay(property.villaNumber).trim().replace(/^#/, "");
      return showBeds && beds > 0
        ? `Villa #${num} · ${bedLabel} · ${dealLabel}`
        : `Villa #${num} · ${dealLabel}`;
    }
    const explicitTitle = property.title?.trim();
    if (explicitTitle) return `${explicitTitle} · ${dealLabel}`;
    if (showBeds && beds > 0) return `${bedLabel} villa · ${dealLabel}`;
    return `${dealLabel} property`;
  })();
  const subAreaMoreHref = subAreaCatalogHref(property);
  const subAreaMoreLabel = subAreaBrowseLinkLabel(property);

  const propertyHeader = (
    <>
      <div className="mb-3 sm:mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0 pr-2">
            <h1 className="text-xl font-bold leading-snug tracking-tight text-gray-900 sm:text-2xl lg:text-3xl">
              {headingTitle}
            </h1>
            <div className="mt-1 text-sm text-gray-500">
              <PropertyLocationLinks property={property} />
            </div>
          </div>
          <PropertyCardActions propertyId={String(property.id)} layout="inline" />
        </div>
      </div>

      <div className="mb-0 lg:mb-5">
        {forSale != null && isSale && (
          <p className="text-base font-semibold text-gray-900 sm:text-lg lg:text-xl">
            <PriceText amount={forSale} sourceCurrency={p.currency} />
            <span className="text-xs font-normal text-gray-500 sm:text-sm ml-2">· for sale</span>
          </p>
        )}
        {(monthly == null || monthly <= 0) && yearly != null && yearly > 0 && !isSale && (
          <p className="text-base font-semibold text-gray-900 sm:text-lg lg:text-xl">
            <PriceText amount={yearly} sourceCurrency={p.currency} />
            <span className="text-xs font-normal text-gray-500 sm:text-sm ml-2">/ year</span>
          </p>
        )}
        {monthly != null && monthly > 0 && (
          <>
            {forSale != null && isSale && <div className="mt-2" />}
            <p className="text-base font-semibold text-gray-900 sm:text-lg lg:text-xl">
              <PriceText amount={monthly} sourceCurrency={p.currency} />
              <span className="text-xs font-normal text-gray-500 sm:text-sm ml-2">/ month</span>
            </p>
            {yearly != null && (
              <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-3">
                <p className="text-sm text-gray-700 sm:text-base">
                  <PriceText amount={yearly} sourceCurrency={p.currency} /> / year
                </p>
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
              Available: {availableFrom ? formatLocaleDate(availableFrom) : "Now"}
            </span>
          </div>
        )}
      </div>
    </>
  );

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
          <nav
            className="mb-6 flex flex-col gap-2 border-b border-stone-200 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
            aria-label="Listing navigation"
          >
            <PropertyBackNav
              property={property}
              returnToFromQuery={returnToFromQuery}
              fallbackNav={fallbackBackNav}
              className="mb-0 w-fit"
            />
            {subAreaMoreHref && subAreaMoreLabel ? (
              <PropertyNavLink href={subAreaMoreHref} className="mb-0 w-fit sm:ml-auto">
                {subAreaMoreLabel}
              </PropertyNavLink>
            ) : null}
          </nav>

          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-8 mb-8">
            <div className="order-1 lg:order-none lg:col-start-2 lg:row-start-1">{propertyHeader}</div>

            <div className="order-2 lg:order-none lg:col-start-1 lg:row-start-1 lg:row-span-2">
              <PropertyImages
                images={property.images || []}
                title={getPropertyDisplayTitle(property)}
                property={property}
              />
            </div>

            <div className="order-3 lg:order-none lg:col-start-2 lg:row-start-2 flex flex-col">
              {property.description?.trim() && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                  <div className="text-gray-700 whitespace-pre-line leading-[1.7]">
                    {fixDescriptionDisplay(property.description)}
                  </div>
                </div>
              )}

              {!isPureLandListing(property) && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Bedrooms</span>
                      <p className="text-lg font-semibold text-gray-900">{property.bedrooms}</p>
                    </div>
                    {property.floors != null && property.floors > 0 && (
                      <div>
                        <span className="text-sm text-gray-600">Floors</span>
                        <p className="text-lg font-semibold text-gray-900">{property.floors}</p>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div>
                        <span className="text-sm text-gray-600">Bathrooms</span>
                        <p className="text-lg font-semibold text-gray-900">{property.bathrooms}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                  areaLabel={[
                    areaLabel,
                    property.subArea != null
                      ? subAreaNames[property.subArea] || property.subArea
                      : SUBAREA_UNSPECIFIED_LABEL,
                  ].join(" • ")}
                  displayLocation={property.displayLocation}
                  mainArea={property.mainArea}
                  subArea={property.subArea}
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
