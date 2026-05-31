/** Scroll to the start of catalog listings (or page top as fallback). */
export function scrollToCatalogListings(behavior: ScrollBehavior = "smooth") {
  const anchor = document.getElementById("catalog-listings-anchor");
  if (anchor) {
    anchor.scrollIntoView({ behavior, block: "start" });
    return;
  }
  window.scrollTo({ top: 0, behavior });
}
