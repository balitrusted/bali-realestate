"use client";

import { useState } from "react";
import Image from "next/image";

interface PropertyImageWithFallbackProps {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  loading?: "eager" | "lazy";
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
  loading = "lazy",
  width,
  height,
  placeholderText = "No photo",
}: PropertyImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);
  const isUploadPath = typeof src === "string" && src.startsWith("/uploads/");
  // Use src as-is so request goes to our API (rewrite → serve-image). API resolves Blob URL (handles random suffix).
  const imageSrc = src;

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

  // Use plain <img> for /uploads/ (request hits our API via rewrite, API streams from Blob)
  if (isUploadPath) {
    const style = fill ? { position: "absolute" as const, inset: 0, width: "100%", height: "100%", objectFit: "cover" as const } : undefined;
    return (
      <img
        src={imageSrc}
        alt={alt}
        className={className}
        style={style}
        loading={loading}
        decoding="async"
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
        loading={loading}
        decoding="async"
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
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
