import PropertyImageWithFallback from "@/components/PropertyImageWithFallback";
import PropertyCardActions from "@/components/PropertyCardActions";
import PropertyViewLink from "@/components/PropertyViewLink";
import PriceText from "@/components/PriceText";
import { Property } from "@/types/property";
import { featureIsYes } from "@/lib/featureState";
import { areas, subAreaNames, SUBAREA_UNSPECIFIED_LABEL } from "@/types/areas";
import { fixDescriptionDisplay, getPropertyDisplayTitle, isPureLandListing } from "@/lib/propertyUtils";
import { getPropertyImageAlt } from "@/lib/imageSeo";

interface PropertyCardProps {
  property: Property;
  /** SEO path segment: `/properties/{detailSlug}` */
  detailSlug: string;
  /** Optional stable returnTo for links (e.g. Similar properties strip) */
  viewReturnPath?: string;
}

// Quick UI switch (easy rollback):
// - "above": title + key info above the image (copy-friendly)
// - "overlay": title + key info over the image (previous variant 1)
// - "below": title below the image (original variant 0)
const PROPERTY_CARD_TITLE_VARIANT: "above" | "overlay" | "below" = "above";

export default function PropertyCard({ property, detailSlug, viewReturnPath }: PropertyCardProps) {
  const formatBasePrice = (price: number, currency: string) =>
    currency === "IDR" ? `${(price / 1000000).toFixed(0)}M IDR` : `$${price.toLocaleString()}`;

  const mainAreaLabel = property.mainArea ? (areas[property.mainArea]?.nameEn || property.mainArea) : null;

  const buildTeaser = (): string | null => {
    const cleanDesc = fixDescriptionDisplay(property.description || "")
      .replace(/\s+/g, " ")
      .trim();

    const isGenericLeadSentence = (s: string) => {
      const t = s.toLowerCase();
      return (
        /^one bedroom\b/.test(t) ||
        /^two bedroom\b/.test(t) ||
        /^three bedroom\b/.test(t) ||
        /^four bedroom\b/.test(t) ||
        /^five bedroom\b/.test(t) ||
        /^villa for rent\b/.test(t) ||
        /^apartment\b/.test(t) ||
        /^land\b/.test(t) ||
        /for rent in\b/.test(t) ||
        /area[,.\s]/.test(t)
      );
    };

    const scoreSentence = (s: string) => {
      const t = s.toLowerCase();
      let score = 0;

      // Penalize geo-only utility lines (distance, maps, nearest cafe, etc.)
      if (
        /walking distance|minutes? to|close to|nearby|google maps|location|area\b|center\b|ubud\b|penestanan\b|lodtunduh\b|petulu\b|sayan\b|tegallalang\b|gentong\b|mas\b/.test(
          t
        )
      ) {
        score -= 2;
      }

      // Reward value-rich property hooks
      if (/brand new|newly built|first occupancy|never rented|freshly built/.test(t)) score += 4;
      if (/private pool|swimming pool|pool/.test(t)) score += 3;
      if (/rice field|open view|nature|jungle|green/.test(t)) score += 3;
      if (/quiet|peaceful|calm|meditative|inspiring/.test(t)) score += 3;
      if (/designer|modern|refined|premium|cozy|well maintained|well cared/.test(t)) score += 3;
      if (/workspace|working desk|remote work|wi-?fi|internet/.test(t)) score += 2;
      if (/enclosed|closed kitchen|living room|air conditioning|bathtub/.test(t)) score += 2;
      if (/parking|car access|scooter/.test(t)) score += 1;
      if (/everything is included|cleaning included|included/.test(t)) score += 2;

      // Slight preference for substantial phrases
      if (s.length >= 60) score += 1;
      if (s.length <= 28) score -= 1;
      return score;
    };

    // Prefer real listing text so cards stay unique and never empty
    // when owners provide meaningful descriptions.
    if (cleanDesc) {
      const sentences = cleanDesc
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim().replace(/^[-•]\s*/, ""))
        .filter((s) => s.length >= 24);

      const candidates = sentences
        .filter((s) => !isGenericLeadSentence(s))
        .map((s) => ({ s, score: scoreSentence(s) }))
        .sort((a, b) => b.score - a.score);

      const candidate = (candidates[0]?.s || cleanDesc).trim();
      if (candidate) {
        return candidate.length > 190 ? `${candidate.slice(0, 187).trimEnd()}…` : candidate;
      }
    }

    const text = `${property.title ?? ""}\n${cleanDesc}`.toLowerCase();
    const loc = mainAreaLabel ?? "Bali";
    const isRent = property.types?.includes("rent");
    const stayPhrase = isRent ? "long-term stay" : "property";

    const hasAny = (...needles: string[]) => needles.some((n) => text.includes(n));

    const pick = (variants: string[]) => {
      // Deterministic pick so it doesn't change between renders
      const seed = String(property.id ?? property.villaNumber ?? "0");
      let h = 0;
      for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
      return variants[h % variants.length];
    };

    // More specific “key value” branches (override generic "brand new")
    // Premium/cozy design + standout bathroom/flow (e.g. Sayan #52)
    if (
      hasAny("cozy", "refined", "premium", "well balanced", "warm, modern") &&
      (hasAny("double shower", "outdoor shower") || featureIsYes(property.features.bathtub) || hasAny("same level as the main living"))
    ) {
      return pick([
        `Cozy premium feel with thoughtful details and a well designed layout. Great for a comfortable ${stayPhrase} in ${loc}.`,
        `Refined atmosphere with a practical modern layout and a strong comfort focus. Ideal for a relaxed ${stayPhrase} in ${loc}.`,
        `Warm modern design with standout bathroom details and an easy indoor-outdoor flow. A great ${stayPhrase} option in ${loc}.`,
      ]);
    }

    // Practical “quiet green + bar counter” vibe (e.g. Gentong #61)
    if (hasAny("bar counter") || hasAny("kitchen with bar counter")) {
      return pick([
        `Quiet green setting with a practical kitchen and bar counter - comfortable for everyday living. A great ${stayPhrase} choice in ${loc}.`,
        `Bright, calm villa with a convenient bar counter kitchen setup. Ideal for a relaxed ${stayPhrase} in ${loc}.`,
      ]);
    }

    // Rice field / open views called out explicitly
    if (hasAny("rice field", "rice-field", "open view", "open views")) {
      return pick([
        `Open views and a peaceful atmosphere - perfect for a calm, inspiring routine. A great ${stayPhrase} option in ${loc}.`,
        `Rice field vibes and a relaxed setting for a quieter daily rhythm. Lovely for a ${stayPhrase} in ${loc}.`,
      ]);
    }

    if (hasAny("newly renovated", "renovated", "renovation")) {
      return pick([
        `Newly renovated and well maintained - fresh, clean and ready to move in. A great option for a comfortable ${stayPhrase} in ${loc}.`,
        `Freshly renovated with everything in great condition. Ideal if you want an easy, move-in-ready ${stayPhrase} in ${loc}.`,
        `Recently renovated for a clean, modern feel. A comfortable choice for a ${stayPhrase} in ${loc}.`,
      ]);
    }

    if (hasAny("brand new", "fully new", "newly built", "freshly built", "never rented", "first guest", "first occupancy")) {
      return pick([
        `Brand new villa - first occupancy, lots of natural light and a calm atmosphere. Ideal for a relaxed ${stayPhrase} in ${loc}.`,
        `New build, ready for first occupancy. Bright spaces and a calm setting - great for a ${stayPhrase} in ${loc}.`,
        `Fully new and move-in ready - a fresh start with a peaceful vibe. Perfect for a ${stayPhrase} in ${loc}.`,
        `Never rented before - clean, bright and quiet. A great match for a comfortable ${stayPhrase} in ${loc}.`,
      ]);
    }

    if (hasAny("affordable", "cheap", "very affordable", "great value", "without overpaying")) {
      return pick([
        `Affordable private villa with a practical layout and everything you need for everyday life. Great value for ${loc} - ideal for a ${stayPhrase}.`,
        `Great value option in ${loc}: your own private place without overpaying. Practical for everyday living and a solid ${stayPhrase} pick.`,
        `A budget-friendly private villa in ${loc} with the essentials done right. A smart choice for a ${stayPhrase}.`,
      ]);
    }

    if (featureIsYes(property.features.enclosedLivingArea) || featureIsYes(property.features.closedKitchen)) {
      return pick([
        `Rare enclosed living setup - cooler, quieter and more comfortable for daily life. A solid choice for a ${stayPhrase} in ${loc}.`,
        `Enclosed living/kitchen - a real comfort upgrade in Bali. Great for a ${stayPhrase} where you want AC and less noise.`,
        `Closed living space for a cooler, more private home feel. Ideal for a ${stayPhrase} in ${loc}.`,
      ]);
    }

    if (hasAny("rice field", "rice-field") || featureIsYes(property.features.natureView)) {
      return pick([
        `Peaceful nature setting with open views - perfect for a calm, inspiring routine. A great ${stayPhrase} option in ${loc}.`,
        `Open views and a green atmosphere for a quieter pace. Lovely for a ${stayPhrase} in ${loc}.`,
        `Nature vibes and a relaxed setting - ideal if you value privacy and greenery. Great for a ${stayPhrase} in ${loc}.`,
      ]);
    }

    if (featureIsYes(property.features.pool)) {
      return pick([
        `Private pool and a comfortable layout for relaxing at home. A practical ${stayPhrase} option in ${loc}.`,
        `Pool-focused setup for easy daily comfort. Great for a ${stayPhrase} where you want to enjoy your own space.`,
        `Your own private pool - simple, enjoyable living with a relaxed vibe. A strong ${stayPhrase} choice in ${loc}.`,
      ]);
    }

    if (featureIsYes(property.features.washingMachine)) {
      return pick([
        `Designed for everyday comfort with a rare washing machine on-site. Great for a ${stayPhrase} in ${loc}.`,
        `Rare bonus: washing machine at home - super practical for longer stays. A solid ${stayPhrase} option in ${loc}.`,
      ]);
    }

    if (featureIsYes(property.features.desk)) {
      return pick([
        `Convenient setup for remote work with a dedicated desk. A good ${stayPhrase} choice in ${loc}.`,
        `Work-friendly layout with a dedicated desk - great for remote work. Comfortable for a ${stayPhrase} in ${loc}.`,
      ]);
    }

    return null;
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
  if (featureIsYes(property.features.bathtub)) featuresList.push("bathtub");
  if (featureIsYes(property.features.carPark)) featuresList.push("car park");
  if (featureIsYes(property.features.closedKitchen)) featuresList.push("enclosed kitchen");
  if (featureIsYes(property.features.enclosedLivingArea)) featuresList.push("enclosed living");
  if (featureIsYes(property.features.desk)) featuresList.push("desk");
  if (featureIsYes(property.features.garage)) featuresList.push("garage");
  if (featureIsYes(property.features.highSpeedWifi)) featuresList.push("high-speed WiFi");
  if (featureIsYes(property.features.natureView)) featuresList.push("nature view");
  if (featureIsYes(property.features.petFriendly)) featuresList.push("pet friendly");
  if (featureIsYes(property.features.pool)) featuresList.push("pool");
  if (featureIsYes(property.features.washingMachine)) featuresList.push("washing machine");

  const mainImage = property.images && property.images.length > 0 
    ? property.images[0] 
    : null;
  const displayTitle = getPropertyDisplayTitle(property);
  const cardTitle =
    isPureLandListing(property) && property.villaNumber?.trim()
      ? `Land #${property.villaNumber.trim().replace(/^#/, "")}`
      : property.villaNumber && property.bedrooms
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
      ? `${formatBasePrice(forSale, p.currency)} · for sale`
      : hasYearlyOnly && yearly != null && yearly > 0
        ? `${formatBasePrice(yearly, p.currency)} / year`
        : monthly != null && monthly > 0
          ? `${formatBasePrice(monthly, p.currency)} / month`
          : null;

  const topSubline = locationLabel || null;
  const teaser = buildTeaser();

  return (
    <article className="flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {PROPERTY_CARD_TITLE_VARIANT === "above" && (
        <div className="p-5 pb-3">
          <h3 className="text-xl font-semibold text-gray-900 leading-snug select-text">
            <PropertyViewLink
              detailSlug={detailSlug}
              viewReturnPath={viewReturnPath}
              className="hover:underline underline-offset-2"
            >
              {cardTitle}
            </PropertyViewLink>
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
          <PropertyViewLink
            detailSlug={detailSlug}
            viewReturnPath={viewReturnPath}
            className="absolute inset-0"
            aria-label={displayTitle}
          >
            <PropertyImageWithFallback
              src={mainImage}
              alt={getPropertyImageAlt(property, 0)}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </PropertyViewLink>
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
            <PropertyViewLink
              detailSlug={detailSlug}
              viewReturnPath={viewReturnPath}
              className="hover:underline underline-offset-2"
            >
              {displayTitle}
            </PropertyViewLink>
          </h3>
        )}
        
        {teaser && (
          <p className="text-gray-600 mb-4 line-clamp-2 select-text">
            {teaser}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
            {property.bedrooms} {property.bedrooms === 1 ? "bed" : "beds"}
          </span>
          {property.bathrooms != null && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
              {property.bathrooms} {property.bathrooms === 1 ? "bath" : "baths"}
            </span>
          )}
          {!isPureLandListing(property) && property.floors != null && property.floors > 0 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
              {property.floors} {property.floors === 1 ? "floor" : "floors"}
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
                      <PriceText amount={forSale} sourceCurrency={p.currency} />
                <span className="text-sm font-normal text-gray-500 ml-1">· for sale</span>
              </p>
            )}
            {(monthly != null && monthly > 0) || hasYearlyOnly ? (
              <div className={forSale != null && isSale ? "mt-1" : ""}>
                {!hasYearlyOnly && monthly != null && monthly > 0 && (
                  <>
                    <p className="text-lg font-semibold text-gray-900">
                      <PriceText amount={monthly} sourceCurrency={p.currency} />
                      <span className="text-sm font-normal text-gray-500 ml-1">/ month</span>
                    </p>
                    {yearly != null && yearly > 0 && (
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <p className="text-sm text-gray-600">
                          <PriceText amount={yearly} sourceCurrency={p.currency} /> / year
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
                    <PriceText amount={yearly} sourceCurrency={p.currency} />
                    <span className="text-sm font-normal text-gray-500 ml-1">/ year</span>
                  </p>
                )}
              </div>
            ) : null}
          </div>

          <PropertyViewLink
            detailSlug={detailSlug}
            viewReturnPath={viewReturnPath}
            className="block text-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            View Details
          </PropertyViewLink>
        </div>
      </div>
    </article>
  );
}
