"use client";

import { useState } from "react";
import PropertyImageWithFallback from "@/components/PropertyImageWithFallback";
import type { Property } from "@/types/property";
import { getPropertyImageAlt } from "@/lib/imageSeo";

interface PropertyImagesProps {
  images: string[];
  title: string;
  /** When provided, alt text is SEO: "Villa 2 beds 33 in Ubud Kemenuh 1" */
  property?: Pick<Property, "types" | "bedrooms" | "villaNumber" | "mainArea" | "subArea">;
}

export default function PropertyImages({ images, title, property }: PropertyImagesProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const getAlt = (index: number) =>
    property ? getPropertyImageAlt(property, index) : `${title} - Image ${index + 1}`;

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">No photos available</span>
      </div>
    );
  }

  const mainImage = images[selectedImageIndex];

  return (
    <div className="space-y-4">
      <div className="relative w-full h-96 rounded-lg overflow-hidden bg-gray-100">
        <PropertyImageWithFallback
          src={mainImage}
          alt={getAlt(selectedImageIndex)}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImageIndex(idx)}
              className={`relative w-full h-24 rounded overflow-hidden border-2 transition-all bg-gray-100 ${
                selectedImageIndex === idx
                  ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2"
                  : "border-gray-200 hover:border-gray-400"
              }`}
              aria-label={getAlt(idx)}
            >
              <PropertyImageWithFallback
                src={image}
                alt={getAlt(idx)}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 25vw, 12.5vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
