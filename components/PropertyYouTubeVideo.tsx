"use client";

import { useState } from "react";
import { youtubeEmbedUrl, youtubeThumbnailUrl } from "@/lib/youtube";

interface PropertyYouTubeVideoProps {
  videoId: string;
  title: string;
}

export default function PropertyYouTubeVideo({ videoId, title }: PropertyYouTubeVideoProps) {
  const [embedSrc, setEmbedSrc] = useState<string | null>(null);

  const startEmbed = () => {
    setEmbedSrc(
      youtubeEmbedUrl(videoId, {
        origin: window.location.origin,
        autoplay: true,
      })
    );
  };

  return (
    <section aria-label="Property video tour">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Video tour</h2>
      <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-black aspect-video">
        {embedSrc ? (
          <iframe
            src={embedSrc}
            title={title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={startEmbed}
            className="group absolute inset-0 h-full w-full"
            aria-label={`Play video: ${title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={youtubeThumbnailUrl(videoId)}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <span className="absolute inset-0 bg-black/25 transition group-hover:bg-black/35" />
            <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-md transition group-hover:scale-105">
              <svg className="ml-1 h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
