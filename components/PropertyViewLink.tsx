"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { persistListingReturnPath } from "@/lib/listingReturnStorage";

type Props = {
  /** URL segment after /properties/ (SEO slug) */
  detailSlug: string;
  className?: string;
  children: React.ReactNode;
  /** When set (e.g. Similar strip), store this path instead of current URL */
  viewReturnPath?: string;
  "aria-label"?: string;
};

function PropertyViewLinkInner({ detailSlug, className, children, viewReturnPath, "aria-label": ariaLabel }: Props) {
  const pathname = usePathname() || "/properties";
  const searchParams = useSearchParams();
  const inferred = useMemo(() => {
    const qs = searchParams.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [pathname, searchParams]);

  const base = viewReturnPath ?? inferred;
  const safe =
    base.startsWith("/") && !base.startsWith("//") && !base.includes("://") ? base : "/properties";
  const href = `/properties/${detailSlug}`;

  return (
    <Link
      href={href}
      className={className}
      aria-label={ariaLabel}
      onClick={() => persistListingReturnPath(safe)}
    >
      {children}
    </Link>
  );
}

export default function PropertyViewLink(props: Props) {
  const fallbackHref = `/properties/${props.detailSlug}`;
  return (
    <Suspense
      fallback={
        <Link href={fallbackHref} className={props.className} aria-label={props["aria-label"]}>
          {props.children}
        </Link>
      }
    >
      <PropertyViewLinkInner {...props} />
    </Suspense>
  );
}
