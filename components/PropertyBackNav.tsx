"use client";

import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import type { Property } from "@/types/property";
import { getPropertyBackNavigation } from "@/lib/propertyViewNavigation";
import { readPersistedListingReturnPath } from "@/lib/listingReturnStorage";

type Nav = { href: string; label: string };

/**
 * Back link: legacy ?returnTo= (SSR), else sessionStorage from last listing click, else fallback.
 */
export default function PropertyBackNav({
  property,
  returnToFromQuery,
  fallbackNav,
  className = "mb-6",
  size = "default",
}: {
  property: Property;
  returnToFromQuery: string | null;
  fallbackNav: Nav;
  className?: string;
  size?: "default" | "sm";
}) {
  const [nav, setNav] = useState<Nav>(() =>
    returnToFromQuery ? getPropertyBackNavigation(property, returnToFromQuery) : fallbackNav
  );

  useLayoutEffect(() => {
    if (returnToFromQuery) return;
    const stored = readPersistedListingReturnPath();
    if (stored) {
      setNav(getPropertyBackNavigation(property, stored));
    }
  }, [property, returnToFromQuery]);

  const iconClass = size === "sm" ? "w-4 h-4 mr-1.5 shrink-0" : "w-5 h-5 mr-2 shrink-0";
  const textClass = size === "sm" ? "text-sm" : "";

  return (
    <Link
      href={nav.href}
      className={`inline-flex items-center font-normal text-gray-600 hover:text-gray-900 ${textClass} ${className}`}
    >
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {nav.label}
    </Link>
  );
}
