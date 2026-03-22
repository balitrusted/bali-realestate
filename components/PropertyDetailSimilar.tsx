"use client";

import { useRef } from "react";
import PropertyCard from "@/components/PropertyCard";
import type { Property } from "@/types/property";

export default function PropertyDetailSimilar({
  properties,
  viewReturnPath,
}: {
  properties: Property[];
  viewReturnPath: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: -1 | 1) => {
    scroller.current?.scrollBy({ left: dir * Math.min(360, typeof window !== "undefined" ? window.innerWidth * 0.85 : 360), behavior: "smooth" });
  };

  if (properties.length === 0) return null;

  return (
    <section className="mt-16 border-t border-gray-200 pt-10" aria-labelledby="similar-properties-heading">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 id="similar-properties-heading" className="text-xl font-semibold text-gray-900">
          Similar properties
        </h2>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            aria-label="Scroll similar properties left"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            aria-label="Scroll similar properties right"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:thin]"
        style={{ scrollbarGutter: "stable" }}
      >
        {properties.map((p) => (
          <div key={p.id} className="w-[min(100%,20rem)] shrink-0 snap-start">
            <PropertyCard property={p} viewReturnPath={viewReturnPath} />
          </div>
        ))}
      </div>
    </section>
  );
}
