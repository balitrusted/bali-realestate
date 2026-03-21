"use client";

import Link from "next/link";
import { MainArea } from "@/types/property";
import { areas } from "@/types/areas";

type CatalogTypeSlug = "rent" | "sale" | "villas" | "land" | "business";

export type CatalogBreadcrumbProps = {
  type?: CatalogTypeSlug | null;
  area?: MainArea | null;
  /** Last segment label (e.g. bedroom count, payment) – shown as current, no link */
  segmentLabel?: string | null;
  /** Optional override for vertical spacing. */
  className?: string;
};

const areaName = (a: MainArea): string => areas[a]?.nameEn ?? a;

export default function CatalogBreadcrumb({
  type = null,
  area = null,
  segmentLabel = null,
  className,
}: CatalogBreadcrumbProps) {
  const items: { label: string; href?: string }[] = [];
  const isRoot = !type && !area && !segmentLabel;

  items.push({ label: "Properties", ...(isRoot ? {} : { href: "/properties" }) });

  if (type === "villas") {
    items.push({ label: "Villas", href: "/properties/villas" });
  } else if (type === "rent") {
    items.push({ label: "Villas", href: "/properties/villas" });
    items.push(area ? { label: "Rent", href: "/properties/rent" } : { label: "Rent" });
  } else if (type === "sale") {
    items.push({ label: "Villas", href: "/properties/villas" });
    items.push(area ? { label: "Buy", href: "/properties/sale" } : { label: "Buy" });
  } else if (type === "land") {
    items.push(area ? { label: "Land", href: "/properties/land" } : { label: "Land" });
  } else if (type === "business") {
    items.push(area ? { label: "Business", href: "/properties/business" } : { label: "Business" });
  }

  if (area) {
    items.push(segmentLabel ? { label: areaName(area), href: `/properties/${type}/${area}` } : { label: areaName(area) });
  }

  if (segmentLabel) {
    items.push({ label: segmentLabel });
  }

  const currentCrumbClass =
    "rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 shadow-sm";
  const linkCrumbClass =
    "rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50/60 hover:text-emerald-800";
  const plainCrumbClass =
    "rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 shadow-sm";

  return (
    <nav
      id="catalog-breadcrumb-anchor"
      aria-label="Breadcrumb"
      className={[className ?? "mb-5", "scroll-mt-6"].join(" ")}
    >
      <ol className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white/90 px-3 py-2 shadow-sm">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-2">
              {i > 0 && (
                <span
                  className="select-none px-0.5 text-[0.7rem] font-light text-emerald-200"
                  aria-hidden
                >
                  –
                </span>
              )}
              {isLast ? (
                <span className={currentCrumbClass} aria-current="page">
                  {item.label}
                </span>
              ) : item.href ? (
                <Link href={item.href} className={linkCrumbClass}>
                  {item.label}
                </Link>
              ) : (
                <span className={plainCrumbClass}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
