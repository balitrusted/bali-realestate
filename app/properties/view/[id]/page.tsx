import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Property } from "@/types/property";
import { readFile } from "fs/promises";
import { join } from "path";
import { parsePropertiesFile } from "@/lib/parseProperties";
import PropertyImages from "@/components/PropertyImages";
import NotifyWhenAvailableForm from "@/components/NotifyWhenAvailableForm";
import PropertyStructuredData from "@/components/PropertyStructuredData";
import { subAreaNames, areas, SUBAREA_UNSPECIFIED_LABEL } from "@/types/areas";
import { getPropertyDisplayTitle, fixDescriptionDisplay } from "@/lib/propertyUtils";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getProperty(id: string): Promise<Property | null> {
  try {
    const filePath = join(process.cwd(), 'data', 'properties.ts');
    const fileContent = await readFile(filePath, 'utf-8');
    const properties = parsePropertiesFile(fileContent);
    return properties.find((p) => p.id === id) || null;
  } catch (error) {
    console.error("Error loading property:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) {
    return {
      title: "Property Not Found",
    };
  }
  const areaInfo = property.mainArea ? areas[property.mainArea] : null;
  const areaName = areaInfo?.nameEn || property.mainArea || 'Bali';
  const displayTitle = getPropertyDisplayTitle(property);
  return {
    title: `${displayTitle} - ${areaName}`,
    description: fixDescriptionDisplay(property.description || "").substring(0, 160),
  };
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    notFound();
  }

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
  if (property.features.bathtub) featuresList.push("Bathtub");
  if (property.features.carPark) featuresList.push("Car park");
  if (property.features.closedKitchen) featuresList.push("Closed kitchen");
  if (property.features.desk) featuresList.push("Desk");
  if (property.features.enclosedLivingArea) featuresList.push("Enclosed living area");
  if (property.features.garage) featuresList.push("Garage");
  if (property.features.highSpeedWifi) featuresList.push("High-speed WiFi");
  if (property.features.natureView) featuresList.push("Nature view");
  if (property.features.petFriendly) featuresList.push("Pet friendly");
  if (property.features.pool) featuresList.push("Pool");
  if (property.features.washingMachine) featuresList.push("Washing machine");

  const areaInfo = property.mainArea ? areas[property.mainArea] : null;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  return (
    <>
      <PropertyStructuredData property={property} baseUrl={baseUrl} />
      <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {property.archived && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-wrap items-center gap-3">
            <span className="font-medium text-amber-800">This villa is currently not available.</span>
            <span className="text-amber-700 text-sm">It may become available again later. Use the form below to get notified.</span>
          </div>
        )}
        {/* Back button */}
        <Link
          href={property.mainArea && property.types && property.types.length > 0 
            ? `/properties/${property.types[0]}/${property.mainArea}`
            : "/properties"}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Properties
        </Link>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Images */}
          <div>
            <PropertyImages images={property.images || []} title={getPropertyDisplayTitle(property)} property={property} />
          </div>

          {/* Property info */}
          <div>
            <div className="mb-4">
              <span className="text-sm text-gray-500">
                {areaInfo?.nameEn}
                {` • ${property.subArea != null ? (subAreaNames[property.subArea] || property.subArea) : SUBAREA_UNSPECIFIED_LABEL}`}
              </span>
              {property.types && property.types.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {property.types.map(type => (
                    <span key={type} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {type === 'rent' ? 'Rent' : type === 'sale' ? 'Sale' : type === 'land' ? 'Land' : 'Business'}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {getPropertyDisplayTitle(property)}
            </h1>
            
            <div className="mb-6">
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
                      <p className="text-lg text-gray-700">
                        {formatPrice(yearly, p.currency)} / year
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
              {property.duration && (
                <p className="text-sm text-gray-600 mt-2">
                  Minimum duration: {property.duration.min} {property.duration.min === 1 ? 'month' : 'months'}
                </p>
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

            {/* CTA: when archived show notify form; otherwise request link */}
            {property.archived ? (
              <NotifyWhenAvailableForm
                propertyId={property.id}
                propertyTitle={getPropertyDisplayTitle(property)}
              />
            ) : (
              <Link
                href={`/request?property=${property.id}`}
                className="block w-full text-center px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors font-medium"
              >
                Request Information
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
