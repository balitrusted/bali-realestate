"use client";

import { useCallback, useRef, useState } from "react";
import type { ArticleGalleryItem } from "@/types/article";

type GuideMediaCarouselProps = {
  items: ArticleGalleryItem[];
  title?: string;
};

export default function GuideMediaCarousel({
  items,
  title = "Area photos",
}: GuideMediaCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const scrollTo = useCallback(
    (next: number) => {
      const track = trackRef.current;
      if (!track) return;
      const clamped = Math.max(0, Math.min(items.length - 1, next));
      const slide = track.children[clamped] as HTMLElement | undefined;
      slide?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
      setIndex(clamped);
    },
    [items.length]
  );

  const onScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.children.length === 0) return;

    const center = track.scrollLeft + track.clientWidth / 2;
    let closest = 0;
    let minDist = Infinity;

    for (let i = 0; i < track.children.length; i++) {
      const el = track.children[i] as HTMLElement;
      const elCenter = el.offsetLeft + el.clientWidth / 2;
      const dist = Math.abs(center - elCenter);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }

    setIndex(closest);
  }, []);

  if (items.length === 0) return null;

  const current = items[index];
  const showNav = items.length > 1;

  return (
    <figure className="my-8 not-prose">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-stone-900">
          {title}
        </h2>
        {showNav ? (
          <span className="shrink-0 text-sm tabular-nums text-stone-500">
            {index + 1} / {items.length}
          </span>
        ) : null}
      </div>

      <div className="relative">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={`${title} carousel`}
        >
          {items.map((item, i) => (
            <div key={item.src} className="w-full shrink-0 snap-center">
              {/* Local public/ assets — plain img avoids optimizer limits on large galleries */}
              <img
                src={item.src}
                alt={item.alt}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                className="max-h-[min(420px,65vh)] w-full rounded-lg object-cover"
              />
            </div>
          ))}
        </div>

        {showNav ? (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              disabled={index === 0}
              onClick={() => scrollTo(index - 1)}
              className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white/95 text-xl text-stone-700 shadow-sm transition hover:bg-white disabled:pointer-events-none disabled:opacity-40 sm:flex"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next photo"
              disabled={index === items.length - 1}
              onClick={() => scrollTo(index + 1)}
              className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white/95 text-xl text-stone-700 shadow-sm transition hover:bg-white disabled:pointer-events-none disabled:opacity-40 sm:flex"
            >
              ›
            </button>
          </>
        ) : null}
      </div>

      {current.caption ? (
        <p className="article-image-caption mt-1 text-right text-xs font-light leading-snug text-stone-500">
          {current.caption}
        </p>
      ) : null}

      {showNav ? (
        <p className="mt-2 text-center text-xs text-stone-400 sm:hidden">
          Swipe for more photos
        </p>
      ) : null}
    </figure>
  );
}
