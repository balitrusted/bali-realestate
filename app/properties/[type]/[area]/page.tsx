import { notFound } from "next/navigation";
import PropertyCard from "@/components/PropertyCard";
import PropertyFilters from "@/components/PropertyFilters";
import PropertyHeaderTitle from "@/components/PropertyHeaderTitle";
import { Property, PropertyType, MainArea } from "@/types/property";
import { areas } from "@/types/areas";
import { readFile } from "fs/promises";
import { join } from "path";
import { parsePropertiesFile } from "@/lib/parseProperties";
import Image from "next/image";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const propertyTypeNames: Record<PropertyType, string> = {
  rent: 'Rent',
  sale: 'Buy',
  land: 'Land',
  business: 'Business',
};

const propertyTypeVerbs: Record<PropertyType, string> = {
  rent: 'Rent',
  sale: 'Buy',
  land: 'Buy',
  business: 'Buy',
};

async function getProperties(type: PropertyType, area: MainArea): Promise<Property[]> {
  try {
    const filePath = join(process.cwd(), 'data', 'properties.ts');
    const fileContent = await readFile(filePath, 'utf-8');
    const properties = parsePropertiesFile(fileContent);
    
    // Filter by type and area; exclude archived (they are not in catalog)
    return properties.filter((p) => {
      const hasPrice = p?.price && (
        typeof p.price.min === 'number' ||
        typeof p.price.monthly === 'number' ||
        typeof p.price.yearly === 'number' ||
        typeof p.price.forSale === 'number'
      );
      return p && p.id && hasPrice && !p.archived && p.types?.includes(type) && p.mainArea === area;
    });
  } catch (error) {
    console.error("Error loading properties:", error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ type: string; area: string }> }) {
  const { type, area } = await params;
  
  const propertyType = type as PropertyType;
  const mainArea = area as MainArea;
  
  if (!propertyTypeNames[propertyType] || !areas[mainArea]) {
    return {
      title: "Properties Not Found",
    };
  }

  const areaInfo = areas[mainArea];
  const typeName = propertyTypeNames[propertyType];
  const verb = propertyTypeVerbs[propertyType];
  
  // Build SEO title and description
  const title = `${verb} ${type === 'rent' ? 'Villas' : type === 'sale' ? 'Villas' : type === 'land' ? 'Land' : 'Business'} in ${areaInfo.nameEn}`;
  const description = areaInfo.seoDescription || 
    `Find ${typeName.toLowerCase()} in ${areaInfo.nameEn}. ${areaInfo.description}`;

  return {
    title: `${title} - Balitrusted`,
    description: description,
    keywords: `${areaInfo.nameEn}, ${typeName}, Bali, real estate, ${type === 'rent' ? 'rental' : 'sale'}`,
  };
}

export default async function PropertiesByTypeAndAreaPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ type: string; area: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { type, area } = await params;
  const queryParams = await searchParams;
  
  const propertyType = type as PropertyType;
  const mainArea = area as MainArea;
  
  if (!propertyTypeNames[propertyType] || !areas[mainArea]) {
    notFound();
  }

  const areaInfo = areas[mainArea];
  let properties = await getProperties(propertyType, mainArea);
  
  // Apply additional filters from query params
  if (queryParams.bedrooms) {
    const bedrooms = Array.isArray(queryParams.bedrooms) 
      ? queryParams.bedrooms.map(Number)
      : [Number(queryParams.bedrooms)];
    properties = properties.filter(p => bedrooms.includes(p.bedrooms));
  }
  
  if (queryParams.subArea) {
    const subAreas = Array.isArray(queryParams.subArea)
      ? queryParams.subArea
      : [queryParams.subArea];
    properties = properties.filter(p => p.subArea != null && subAreas.includes(p.subArea));
  }
  
  // Filter by features
  if (queryParams.hasBathtub === 'true') {
    properties = properties.filter(p => p.features.bathtub);
  }
  if (queryParams.hasCarPark === 'true') {
    properties = properties.filter(p => p.features.carPark);
  }
  if (queryParams.hasClosedKitchen === 'true') {
    properties = properties.filter(p => p.features.closedKitchen);
  }
  if (queryParams.hasDesk === 'true') {
    properties = properties.filter(p => p.features.desk);
  }
  if (queryParams.hasEnclosedLiving === 'true') {
    properties = properties.filter(p => p.features.enclosedLivingArea);
  }
  if (queryParams.hasGarage === 'true') {
    properties = properties.filter(p => p.features.garage);
  }
  if (queryParams.hasHighSpeedWifi === 'true') {
    properties = properties.filter(p => p.features.highSpeedWifi);
  }
  if (queryParams.hasNatureView === 'true') {
    properties = properties.filter(p => p.features.natureView);
  }
  if (queryParams.hasPetFriendly === 'true') {
    properties = properties.filter(p => p.features.petFriendly);
  }
  if (queryParams.hasPool === 'true') {
    properties = properties.filter(p => p.features.pool);
  }
  if (queryParams.hasWashingMachine === 'true') {
    properties = properties.filter(p => p.features.washingMachine);
  }
  
  // Sort by order
  const sortedProperties = [...properties].sort((a, b) => {
    const orderA = a.order ?? 999;
    const orderB = b.order ?? 999;
    return orderA - orderB;
  });

  const typeName = propertyTypeNames[propertyType];
  const verb = propertyTypeVerbs[propertyType];
  
  // Build feature-based SEO text
  const featureTexts: string[] = [];
  if (queryParams.hasBathtub === 'true') featureTexts.push('with bathtub');
  if (queryParams.hasCarPark === 'true') featureTexts.push('with car park');
  if (queryParams.hasClosedKitchen === 'true') featureTexts.push('with closed kitchen');
  if (queryParams.hasDesk === 'true') featureTexts.push('with desk');
  if (queryParams.hasEnclosedLiving === 'true') featureTexts.push('with enclosed living');
  if (queryParams.hasGarage === 'true') featureTexts.push('with garage');
  if (queryParams.hasHighSpeedWifi === 'true') featureTexts.push('with high-speed WiFi');
  if (queryParams.hasNatureView === 'true') featureTexts.push('with nature view');
  if (queryParams.hasPetFriendly === 'true') featureTexts.push('with pet friendly');
  if (queryParams.hasPool === 'true') featureTexts.push('with pool');
  if (queryParams.hasWashingMachine === 'true') featureTexts.push('with washing machine');
  
  const featureText = featureTexts.length > 0 ? ` ${featureTexts.join(', ')}` : '';

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Area Header with Image */}
        {areaInfo.image && (
          <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
            <Image
              src={areaInfo.image}
              alt={areaInfo.nameEn}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                  <PropertyHeaderTitle type={propertyType} currentArea={mainArea} variant="hero" />
                </h1>
                {featureText && (
                  <p className="text-xl md:text-2xl opacity-90">
                    {featureText}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {!areaInfo.image && (
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              <PropertyHeaderTitle type={propertyType} currentArea={mainArea} variant="default" />
            </h1>
            {featureText && (
              <p className="text-xl text-gray-600">
                {featureText}
              </p>
            )}
            <p className="text-gray-600 mt-4">
              {areaInfo.description}
            </p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar with filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <PropertyFilters 
              defaultType={propertyType}
              defaultMainArea={mainArea}
            />
          </aside>

          {/* Properties grid */}
          <div className="flex-1">
            {sortedProperties.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  No properties found in this category.
                </p>
                <p className="text-sm text-gray-500">
                  Check other areas or property types.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  Found {sortedProperties.length} {sortedProperties.length === 1 ? 'property' : 'properties'}
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {sortedProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
