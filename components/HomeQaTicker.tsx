"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { QaRecentItem } from "@/types/qa";
import { qaCategoryLabel } from "@/lib/qaHub";

const ROTATE_MS = 8000;
const POLL_MS = 60_000;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function HomeQaTicker() {
  const [items, setItems] = useState<QaRecentItem[]>([]);
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/qa/recent?limit=15", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.items) && data.items.length > 0) {
          setItems(data.items);
        }
      } catch {
        /* ignore */
      }
    };
    load();
    const poll = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, []);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % items.length);
        setFade(true);
      }, 200);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;

  const item = items[index % items.length];
  const action =
    item.type === "answer"
      ? item.isOfficial
        ? "answered"
        : "replied"
      : "asked";

  return (
    <section className="border-y border-emerald-100 bg-emerald-50/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
              Live Q&amp;A
            </span>
          </div>
          <div
            className={`flex-1 min-w-0 text-sm text-stone-700 transition-opacity duration-200 ${
              fade ? "opacity-100" : "opacity-0"
            }`}
          >
            <span className="font-medium text-stone-900">{item.authorDisplayName}</span>{" "}
            {action}{" "}
            <Link
              href={`/qa/${item.questionSlug}`}
              className="text-emerald-900 hover:underline font-medium"
            >
              {item.questionTitle}
            </Link>
            <span className="text-stone-500 ml-2">
              · {qaCategoryLabel(item.category)} · {timeAgo(item.at)}
            </span>
          </div>
          <Link
            href="/qa"
            className="text-xs font-semibold text-emerald-900 hover:underline shrink-0"
          >
            View all
          </Link>
        </div>
      </div>
    </section>
  );
}
