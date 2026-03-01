"use client";

import { useState } from "react";
import Image from "next/image";

interface PropertyImageWithFallbackProps {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  /** For fixed-size (e.g. admin thumb) */
  width?: number;
  height?: number;
  placeholderText?: string;
}

export default function PropertyImageWithFallback({
  src,
  alt,
  fill,
  className,
  sizes,
  width,
  height,
  placeholderText = "No photo",
}: PropertyImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={className}
        style={
          fill
            ? { position: "absolute", inset: 0 }
            : width && height
              ? { width, height }
              : undefined
        }
      >
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400 text-sm">{placeholderText}</span>
        </div>
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 400}
      height={height ?? 300}
      className={className}
      sizes={sizes}
      onError={() => setFailed(true)}
    />
  );
}
