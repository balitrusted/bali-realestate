"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useLayoutEffect, useState } from "react";
import type { Property } from "@/types/property";
import { getPropertyBackNavigation } from "@/lib/propertyViewNavigation";
import { readPersistedListingReturnPath } from "@/lib/listingReturnStorage";

type Nav = { href: string; label: string };

export const PROPERTY_NAV_LINK_CLASS =
  "inline-flex items-center rounded-md border border-stone-200 px-2.5 py-1 text-sm font-normal leading-none text-stone-600 hover:border-stone-300 hover:text-stone-900 transition-colors";

export function PropertyNavLink({
  href,
  className = "",
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${PROPERTY_NAV_LINK_CLASS} ${className}`.trim()}>
      <span aria-hidden className="mr-1 text-stone-400">
        ←
      </span>
      {children}
    </Link>
  );
}

/**
 * Back link: legacy ?returnTo= (SSR), else sessionStorage from last listing click, else fallback.
 */
export default function PropertyBackNav({
  property,
  returnToFromQuery,
  fallbackNav,
  className = "mb-6",
}: {
  property: Property;
  returnToFromQuery: string | null;
  fallbackNav: Nav;
  className?: string;
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
    <PropertyNavLink href={nav.href} className={className}>
      {nav.label}
    </PropertyNavLink>
  );
}
