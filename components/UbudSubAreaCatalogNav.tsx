import Link from "next/link";
import { subAreaNames } from "@/types/areas";
import type { SubArea } from "@/types/property";
import { UBUD_AREA_GUIDE_SUBAREAS_ORDER } from "@/lib/ubudAreaGuideArticles";
import type { CatalogTypeForSeo } from "@/lib/seoTemplates";

type Props = {
  catalogType: CatalogTypeForSeo;
  activeSubArea?: SubArea;
};

const chipBase =
  "inline-flex rounded-full border px-3 py-1.5 text-sm font-medium shadow-sm transition";
const chipActive =
  "border-emerald-400 bg-emerald-50 text-emerald-950";
const chipInactive =
  "border-gray-200/90 bg-white text-gray-800 hover:border-emerald-300 hover:bg-emerald-50/90 hover:text-emerald-950";

/** Clean-path chips for Ubud sub-areas: /properties/{type}/ubud/{subArea} */
export default function UbudSubAreaCatalogNav({ catalogType, activeSubArea }: Props) {
  const base = `/properties/${catalogType}/ubud`;

  return (
    <nav className="mb-6" aria-label="Ubud neighborhoods">
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800 mb-2">
        Ubud neighborhoods
      </p>
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            href={base}
            className={`${chipBase} ${activeSubArea ? chipInactive : chipActive}`}
          >
            All Ubud
          </Link>
        </li>
        {UBUD_AREA_GUIDE_SUBAREAS_ORDER.map((subArea) => (
          <li key={subArea}>
            <Link
              href={`${base}/${subArea}`}
              className={`${chipBase} ${activeSubArea === subArea ? chipActive : chipInactive}`}
            >
              {subAreaNames[subArea]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
