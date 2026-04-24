"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SearchHit = {
  id: string;
  title: string;
  meta: string;
  thumbUrl: string | null;
  href: string;
};

function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function SiteSearch({ className = "" }: { className?: string }) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const debounced = useDebouncedValue(q.trim(), 280);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [active, setActive] = useState(-1);

  const trackQuery = useCallback(
    (query: string, source: "site_search_submit" | "site_search_suggestion_click", propertyId?: string) => {
      const q = query.trim();
      if (!q) return;
      void fetch("/api/search/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          query: q,
          source,
          propertyId,
          path: typeof window !== "undefined" ? window.location.pathname + window.location.search : undefined,
        }),
      }).catch(() => {});
    },
    []
  );

  const runSearch = useCallback(async (query: string) => {
    if (!query) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`);
      if (!res.ok) throw new Error("search failed");
      const data = (await res.json()) as { results: SearchHit[] };
      setHits(Array.isArray(data.results) ? data.results : []);
    } catch {
      setHits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open && !debounced) return;
    void runSearch(debounced);
  }, [debounced, open, runSearch]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const goFull = () => {
    const t = q.trim();
    if (!t) return;
    trackQuery(t, "site_search_submit");
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(t)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!hits.length) {
      if (e.key === "Enter") goFull();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(hits.length - 1, i + 1 < 0 ? 0 : i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === "Enter") {
      if (active >= 0 && hits[active]) {
        e.preventDefault();
        trackQuery(q, "site_search_suggestion_click", hits[active].id);
        router.push(hits[active].href);
        setOpen(false);
        setQ("");
      } else {
        goFull();
      }
    }
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <label htmlFor={listId} className="sr-only">
        Search properties
      </label>
      <div className="flex rounded-md border border-gray-200 bg-gray-50/80 shadow-sm focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-400/30">
        <input
          ref={inputRef}
          id={listId}
          type="search"
          autoComplete="off"
          placeholder="Search villas & listings…"
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${listId}-listbox`}
          aria-autocomplete="list"
        />
        <button
          type="button"
          onClick={goFull}
          className="shrink-0 px-3 text-sm font-medium text-emerald-800 hover:text-emerald-950"
        >
          Search
        </button>
      </div>

      {open && (q.trim() !== "" || loading) && (
        <div
          id={`${listId}-listbox`}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[min(70vh,24rem)] overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          {loading && <div className="px-3 py-2 text-sm text-gray-500">Searching…</div>}
          {!loading && hits.length === 0 && debounced && (
            <div className="px-3 py-2 text-sm text-gray-600">No matches. Try filters or fewer words.</div>
          )}
          {!loading &&
            hits.map((h, i) => (
              <Link
                key={h.id}
                href={h.href}
                role="option"
                aria-selected={i === active}
                className={`flex items-center gap-3 px-3 py-2 text-left hover:bg-emerald-50/60 ${
                  i === active ? "bg-emerald-50" : ""
                }`}
                onClick={() => {
                  trackQuery(q, "site_search_suggestion_click", h.id);
                  setOpen(false);
                  setQ("");
                }}
                onMouseEnter={() => setActive(i)}
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100">
                  {h.thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={h.thumbUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                      No photo
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-900">{h.title}</div>
                  <div className="truncate text-xs text-gray-500">{h.meta}</div>
                </div>
              </Link>
            ))}
          {!loading && debounced && (
            <button
              type="button"
              className="w-full border-t border-gray-100 px-3 py-2 text-left text-sm font-medium text-emerald-800 hover:bg-emerald-50/50"
              onClick={goFull}
            >
              View all results for &quot;{debounced.slice(0, 48)}
              {debounced.length > 48 ? "…" : ""}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
