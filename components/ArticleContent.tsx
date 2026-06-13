"use client";

import { Fragment, useEffect } from "react";
import GuideMediaCarousel from "@/components/GuideMediaCarousel";
import AreaGuideMap from "@/components/AreaGuideMap";
import {
  AREA_GUIDE_GALLERY_END_SLOT,
  AREA_GUIDE_MAP_SLOT,
} from "@/lib/areaGuideMapSlot";
import type { ArticleAreaMap, ArticleGalleryItem } from "@/types/article";

interface ArticleContentProps {
  content: string;
  /** Optional intro line — same typography as article body (not a separate “lead” style). */
  lead?: string;
  gallery?: ArticleGalleryItem[];
  galleryTitle?: string;
  galleryEnd?: ArticleGalleryItem[];
  galleryEndTitle?: string;
  areaMap?: ArticleAreaMap;
}

// Normalize ID - convert to lowercase and handle special cases
function normalizeId(id: string): string {
  return id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ArticleContent({
  content,
  lead,
  gallery,
  galleryTitle,
  galleryEnd,
  galleryEndTitle,
  areaMap,
}: ArticleContentProps) {
  const contentParts = content.includes(AREA_GUIDE_MAP_SLOT)
    ? content.split(AREA_GUIDE_MAP_SLOT)
    : [content];

  const contentWithGalleryEnd = contentParts.map((part, mapIndex) => {
    if (!part.includes(AREA_GUIDE_GALLERY_END_SLOT)) return [{ key: `${mapIndex}-0`, html: part }];
    return part.split(AREA_GUIDE_GALLERY_END_SLOT).map((chunk, galleryIndex) => ({
      key: `${mapIndex}-${galleryIndex}`,
      html: chunk,
    }));
  });

  useEffect(() => {
    // Add IDs to all headings automatically if they don't have one
    const headings = document.querySelectorAll(
      ".prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6"
    );
    headings.forEach((heading) => {
      if (!heading.id) {
        const text = heading.textContent || "";
        const id = normalizeId(text);
        heading.id = id;
      }
    });

    // Normalize all anchor links to use lowercase IDs
    const links = document.querySelectorAll('.prose a[href^="#"]');
    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        const id = href.substring(1);
        const normalizedId = normalizeId(id);
        if (id !== normalizedId) {
          link.setAttribute("href", `#${normalizedId}`);
        }
      }
    });
  }, [content, lead]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "A" && target.getAttribute("href")?.startsWith("#")) {
      e.preventDefault();
      const href = target.getAttribute("href");
      if (href) {
        const id = normalizeId(href.substring(1));

        let element = document.getElementById(id);

        if (!element) {
          const allElements = document.querySelectorAll("[id]");
          for (let el of allElements) {
            if (normalizeId(el.id) === id) {
              element = el as HTMLElement;
              break;
            }
          }
        }

        if (element) {
          const offset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });

          window.history.pushState(null, "", `#${id}`);
        } else {
          console.warn(`Element with ID "${id}" not found`);
        }
      }
    }
  };

  return (
    <>
      {lead ? (
        <p className="mb-6 rounded-xl border border-stone-200 border-l-4 border-l-stone-400 bg-stone-50 px-5 py-4 text-[1.0625rem] leading-[1.7] text-stone-700">
          {lead}
        </p>
      ) : null}
      {gallery && gallery.length > 0 ? (
        <GuideMediaCarousel items={gallery} title={galleryTitle} />
      ) : null}
      <div className="prose prose-article max-w-none" onClick={handleClick}>
        {contentWithGalleryEnd.map((sections, mapIndex) => (
          <Fragment key={mapIndex}>
            {mapIndex > 0 && areaMap ? (
              <AreaGuideMap
                boundaryUrl={areaMap.boundaryUrl}
                title={areaMap.title}
                caption={areaMap.caption}
                pois={areaMap.pois}
              />
            ) : null}
            {sections.map((section, sectionIndex) => (
              <Fragment key={section.key}>
                {sectionIndex > 0 && galleryEnd && galleryEnd.length > 0 ? (
                  <GuideMediaCarousel
                    items={galleryEnd}
                    title={galleryEndTitle}
                  />
                ) : null}
                <div dangerouslySetInnerHTML={{ __html: section.html }} />
              </Fragment>
            ))}
          </Fragment>
        ))}
      </div>
    </>
  );
}
