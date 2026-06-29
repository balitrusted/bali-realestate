import Link from "next/link";
import type { Property } from "@/types/property";
import { subAreaNames, SUBAREA_UNSPECIFIED_LABEL } from "@/types/areas";
import {
  mainAreaCatalogHref,
  mainAreaCatalogLabel,
  subAreaCatalogHref,
} from "@/lib/propertyCatalogLinks";

type Props = {
  property: Property;
  className?: string;
  linkClassName?: string;
};

const defaultLinkClass =
  "text-emerald-800 underline-offset-2 hover:text-emerald-900 hover:underline";

export default function PropertyLocationLinks({
  property,
  className = "",
  linkClassName = defaultLinkClass,
}: Props) {
  const mainLabel = mainAreaCatalogLabel(property);
  if (!mainLabel) return null;

  const mainHref = mainAreaCatalogHref(property);
  const subHref = subAreaCatalogHref(property);
  const subLabel =
    property.subArea != null
      ? subAreaNames[property.subArea] || property.subArea
      : SUBAREA_UNSPECIFIED_LABEL;

  return (
    <span className={className}>
      {mainHref ? (
        <Link href={mainHref} className={linkClassName}>
          {mainLabel}
        </Link>
      ) : (
        <span>{mainLabel}</span>
      )}
      <span aria-hidden> · </span>
      {property.subArea != null && subHref ? (
        <Link href={subHref} className={linkClassName}>
          {subLabel}
        </Link>
      ) : (
        <span>{subLabel}</span>
      )}
    </span>
  );
}
