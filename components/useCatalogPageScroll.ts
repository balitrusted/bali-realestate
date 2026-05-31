"use client";

import { useEffect, useRef } from "react";
import { scrollToCatalogListings } from "@/lib/catalogPaginationScroll";

/** After client-side pagination (?page=), scroll to listing grid top — not on first paint. */
export function useCatalogPageScroll(page: number) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    scrollToCatalogListings("smooth");
  }, [page]);
}
