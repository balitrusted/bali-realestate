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
}: {
  property: Property;
  returnToFromQuery: string | null;
  fallbackNav: Nav;
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

  return (
    <Link href={nav.href} className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
      <svg className="w-5 h-5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {nav.label}
    </Link>
  );
}
