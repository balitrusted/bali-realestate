"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Props = {
  propertyId: string;
  className?: string;
  children: React.ReactNode;
  viewReturnPath?: string;
  "aria-label"?: string;
};

function PropertyViewLinkInner({ propertyId, className, children, viewReturnPath, "aria-label": ariaLabel }: Props) {
  const pathname = usePathname() || "/properties";
  const searchParams = useSearchParams();
  const inferred = useMemo(() => {
    const qs = searchParams.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [pathname, searchParams]);

  const base = viewReturnPath ?? inferred;
  const safe =
    base.startsWith("/") && !base.startsWith("//") && !base.includes("://") ? base : "/properties";
  const href = `/properties/view/${propertyId}?returnTo=${encodeURIComponent(safe)}`;

  return (
    <Link href={href} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

export default function PropertyViewLink(props: Props) {
  const fallbackHref = `/properties/view/${props.propertyId}`;
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
