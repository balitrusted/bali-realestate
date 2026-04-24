"use client";

import { useEffect } from "react";

export default function SearchQueryTracker({ query }: { query: string }) {
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    void fetch("/api/search/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: q,
        source: "search_page_view",
        path: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/search",
      }),
      keepalive: true,
    }).catch(() => {});
  }, [query]);

  return null;
}
