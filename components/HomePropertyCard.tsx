import Link from "next/link";
import Image from "next/image";
import PropertyCardActions from "@/components/PropertyCardActions";
import { Property } from "@/types/property";
import { areas } from "@/types/areas";
import { getPropertyDisplayTitle } from "@/lib/propertyUtils";
import { getPropertyImageAlt } from "@/lib/imageSeo";

interface HomePropertyCardProps {
  property: Property;
}

export default function HomePropertyCard({ property }: HomePropertyCardProps) {
  const mainImage = property.images?.[0] ?? null;
  const displayTitle = getPropertyDisplayTitle(property);
  const areaName = property.mainArea ? areas[property.mainArea]?.nameEn ?? property.mainArea : "—";
  const p = property.price;
  const monthly = p?.monthly ?? p?.min;
  const yearly = p?.yearly;
  const forSale = p?.forSale;
  const isSale = property.types?.includes("sale");
  const priceLabel = isSale && forSale
    ? `${(forSale / 1_000_000).toFixed(0)}M IDR`
    : yearly != null && yearly > 0
      ? `${(yearly / 1_000_000).toFixed(0)}M IDR/yr`
      : monthly != null && monthly > 0
        ? `${(monthly / 1_000_000).toFixed(0)}M IDR/mo`
        : "—";

  return (
    <Link
      href={`/properties/view/${property.id}`}
      className="group flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:border-gray-300 transition-all"
    >
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={getPropertyImageAlt(property, 0)}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No photo
          </div>
        )}
        <PropertyCardActions propertyId={String(property.id)} />
      </div>
      <div className="p-3 flex flex-col flex-1 min-h-0">
        <p className="font-medium text-gray-900 text-sm line-clamp-2 mb-0.5">
          {displayTitle}
        </p>
        <p className="text-xs text-gray-500">{areaName}</p>
        <p className="text-xs font-medium text-gray-700 mt-auto pt-1">{priceLabel}</p>
      </div>
    </Link>
  );
}
