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
  const isUploadPath = typeof src === "string" && src.startsWith("/uploads/");
  // Direct Blob URL: no API, browser loads from Vercel Blob (set NEXT_PUBLIC_BLOB_STORE_URL in Vercel)
  const blobBase = (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BLOB_STORE_URL)
    ? String(process.env.NEXT_PUBLIC_BLOB_STORE_URL).trim().replace(/\/$/, "")
    : "";
  const imageSrc = isUploadPath && blobBase && src.startsWith("/uploads/properties/")
    ? `${blobBase}/properties/${src.replace(/^\/uploads\/properties\//, "")}`
    : src;

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

  // Use plain <img> for /uploads/ (or direct Blob URL when NEXT_PUBLIC_BLOB_STORE_URL is set)
  if (isUploadPath || (blobBase && imageSrc !== src)) {
    const style = fill ? { position: "absolute" as const, inset: 0, width: "100%", height: "100%", objectFit: "cover" as const } : undefined;
    return (
      <img
        src={imageSrc}
        alt={alt}
        className={className}
        style={style}
        onError={() => setFailed(true)}
      />
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
