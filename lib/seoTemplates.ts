import { PropertyType, MainArea, SubArea } from "@/types/property";
import { areas, subAreaNames } from "@/types/areas";
import { resolveAreaLabel, resolveAreaSeoDescription } from "@/lib/mainAreaRegistry";
import { ubudSubAreaIntro, ubudSubAreaSeoKeywords, ubudSubAreaSeoTitle } from "@/lib/ubudSubAreaContent";

export type CatalogTypeForSeo = PropertyType | "villas";

const typeLabels: Record<string, string> = {
  rent: "Rent",
  sale: "Buy",
  /** Used in generic titles like "Land for Sale in Ubud" when segment filters apply */
  land: "Sale",
  business: "Sale",
  hotels: "Rent",
  villas: "Rent or Buy",
};

const subjectByType: Record<string, string> = {
  rent: "Villas",
  sale: "Villas",
  land: "Land",
  business: "Business",
  hotels: "Retreat Hotels",
  villas: "Villas",
};

const areaName = (a: MainArea) => resolveAreaLabel(String(a));

const UBUD_RENT_BEDROOM_LABELS: Record<number, string> = {
  1: "1 Bedroom Villas for Rent in Ubud",
  2: "2 Bedroom Villas for Rent in Ubud",
  3: "3 Bedroom Villas for Rent in Ubud",
  4: "4 Bedroom Villas for Rent in Ubud",
};

export function buildTitle(
  type: CatalogTypeForSeo,
  area?: MainArea,
  subArea?: SubArea,
  segment?: { kind: string | null; value: string | number }
): string {
  if (type === "villas" && !segment) {
    if (area) return `All Villas in ${areaName(area)} | Rent or Buy | Balitrusted`;
    return "All Villas for Rent & Sale in Bali | Balitrusted";
  }
  if (type === "land" && !segment) {
    if (area) return `Buy Land in ${areaName(area)} | Balitrusted`;
    return "Buy Land in Bali | Plots, Leasehold & Freehold | Balitrusted";
  }
  if (type === "business" && !segment) {
    if (area) return `Buy a Business in ${areaName(area)} | Commercial Property | Balitrusted`;
    return "Buy a Business in Bali | Commercial & Hospitality | Balitrusted";
  }
  if (type === "hotels" && !segment) {
    if (area) {
      return `Retreat Hotels & Spaces in ${areaName(area)} | Hotels for Retreats | Balitrusted`;
    }
    return "Retreat Hotels & Spaces in Bali | Hotels for Retreats in Ubud | Balitrusted";
  }
  const subject = subjectByType[type] ?? "Villas";
  const verb = typeLabels[type] ?? "Rent";
  const loc = area ? areaName(area) : "Bali";
  const sub = subArea ? ` in ${subAreaNames[subArea]}` : "";

  if (segment?.kind === "bedroom") {
    if (type === "rent" && area === "ubud") {
      const n = Number(segment.value);
      const custom = UBUD_RENT_BEDROOM_LABELS[n];
      if (custom) return `${custom} | Monthly & Yearly | Balitrusted`;
    }
    return `${segment.value} Bedroom ${subject} for ${verb} in ${loc}${sub} | Balitrusted`;
  }
  if (segment?.kind === "payment") {
    const pay = segment.value === "yearly" ? "Yearly" : "Monthly";
    return `${subject} for ${verb} ${pay} in ${loc}${sub} | Balitrusted`;
  }
  if (segment?.kind === "amenity") {
    const amenityLabel = (segment.value as string).replace(/-/g, " ");
    return `${subject} with ${amenityLabel} for ${verb} in ${loc}${sub} | Balitrusted`;
  }
  if (segment?.kind === "subArea") {
    const custom = subArea ? ubudSubAreaSeoTitle[subArea] : undefined;
    if (custom) return custom;
    return `${subject} for ${verb} in ${subAreaNames[subArea!]}, Ubud | Balitrusted`;
  }
  if (area) {
    return `${subject} for ${verb} in ${loc} | Balitrusted`;
  }
  if (type === "rent") {
    return "Villas for Rent in Bali | Long-Term Rentals | Balitrusted";
  }
  if (type === "sale") {
    return "Villas for Sale in Bali | Balitrusted";
  }
  if (type) {
    return `${subject} for ${verb} in Bali | Balitrusted`;
  }
  return "All Bali Properties for Rent and Sale | Villas, Land and Investments - Balitrusted";
}

export function buildH1(
  type: CatalogTypeForSeo,
  area?: MainArea,
  subArea?: SubArea,
  segment?: { kind: string | null; value: string | number }
): string {
  if (type === "villas" && !segment) {
    if (area) return `All villas in ${areaName(area)}`;
    return "All villas";
  }
  if (type === "land" && !segment) {
    if (area) return `Buy land in ${areaName(area)}`;
    return "Buy land in Bali";
  }
  if (type === "business" && !segment) {
    if (area) return `Buy a business in ${areaName(area)}`;
    return "Buy a business in Bali";
  }
  if (type === "hotels" && !segment) {
    if (area) return `Retreat hotels & spaces in ${areaName(area)}`;
    return "Retreat hotels & spaces in Bali";
  }
  const subject = subjectByType[type] ?? "Villas";
  const verb = typeLabels[type] ?? "Rent";
  const loc = area ? areaName(area) : "Bali";
  const sub = subArea ? ` in ${subAreaNames[subArea]}` : "";

  if (segment?.kind === "bedroom") {
    if (type === "rent" && area === "ubud") {
      const n = Number(segment.value);
      const custom = UBUD_RENT_BEDROOM_LABELS[n];
      if (custom) return custom;
    }
    return `${segment.value} Bedroom ${subject} for ${verb} in ${loc}${sub}`;
  }
  if (segment?.kind === "payment") {
    const pay = segment.value === "yearly" ? "Yearly" : "Monthly";
    return `${subject} for ${verb} ${pay} in ${loc}${sub}`;
  }
  if (segment?.kind === "amenity") {
    const amenityLabel = (segment.value as string).replace(/-/g, " ");
    return `${subject} with ${amenityLabel} for ${verb} in ${loc}${sub}`;
  }
  if (segment?.kind === "subArea") {
    if (subArea === "peliatan" && type === "rent") {
      return "Villas for Rent in Peliatan, Ubud";
    }
    return `${subject} for ${verb} in ${subAreaNames[subArea!]}, Ubud`;
  }
  if (area) {
    return `${subject} for ${verb} in ${loc}`;
  }
  if (type === "rent") {
    return "Villas for rent in Bali";
  }
  if (type === "sale") {
    return "Villas for sale in Bali";
  }
  if (type) {
    return `${subject} for ${verb} in Bali`;
  }
  return "Bali Properties for Rent and Sale";
}

/** Short intro line for the top of the catalog page (visible block under H1). */
export function buildIntro(
  type?: CatalogTypeForSeo | null,
  area?: MainArea,
  segment?: { kind: string | null; value: string | number }
): string {
  if (!type) {
    return "Explore our curated collection of properties across Bali.";
  }
  if (type === "villas" && !area && !segment) {
    return "Here you'll find every villa currently in our catalogue—available for long-term rent or for purchase. We refresh listings as they change. Use the filters to narrow by area, bedrooms, budget, and amenities, or browse the full set below.";
  }
  if (type === "rent" && !area && !segment) {
    return "Compare long-term villas for rent in Bali—verified listings with clear pricing. Ready to rent a villa in Bali for a month or longer? Filter by area, bedrooms, pool, enclosed living, payment terms, and more.";
  }
  if (type === "sale" && !area && !segment) {
    return "Explore villas for sale in Bali in one curated catalogue. Planning to buy a villa in Bali for living or investment? Filter by area, size, features, and ownership context—then shortlist what fits your budget.";
  }
  if (type === "land" && !area && !segment) {
    return "Here you can browse land parcels we currently list as available for purchase across Bali. This section is still growing—more filters are on the way; for now, open each plot below for full context.";
  }
  if (type === "business" && !area && !segment) {
    return "Here you can explore business and commercial listings we currently track in Bali—hospitality-ready villas, guesthouses, and similar opportunities. More filters will follow; for now, review what is live below.";
  }
  if (type === "hotels" && !area && !segment) {
    return "Browse retreat hotels and venue spaces in Bali for yoga retreats, workshops, and group programs. Filter by area and amenities, then contact us for availability, capacity, and pricing for your dates.";
  }
  const loc = area ? areaName(area) : "Bali";
  const subject = (subjectByType[type] ?? "villas").toLowerCase();
  if (type === "land" && area && !segment) {
    return `Thinking about buying land in ${loc}? Here are plots we currently list in this area—useful if you plan to build or hold land long-term. Confirm access, zoning, and title (land leasehold vs land freehold for your case) with qualified advisers before you commit.`;
  }
  if (type === "business" && area && !segment) {
    return `Looking to buy a business in ${loc} or pick up commercial-ready property? Browse what we list here, then validate permits, leases, and local regulations with professionals who know the area.`;
  }
  if (type === "hotels" && area && !segment) {
    return `Retreat hotels and venue spaces in ${loc} for facilitators searching space for retreats in Bali or a hotel for retreats in ${loc}. Compare capacity, yoga shalas, and group-stay options below.`;
  }
  if (area && !segment) {
    return `Find ${subject} for ${typeLabels[type]?.toLowerCase() ?? type} in ${loc}. Use filters to narrow your search.`;
  }
  if (segment?.kind === "bedroom") {
    if (type === "rent" && area === "ubud") {
      const n = Number(segment.value);
      if (n >= 1 && n <= 4) {
        return `Browse ${n}-bedroom villas for long-term rent in Ubud. Compare monthly and yearly options, then narrow by sub-area and amenities like pool, enclosed living, bathtub, and nature view.`;
      }
    }
    return `${segment.value} bedroom ${subject} in ${loc}. Browse listings and filter by amenities.`;
  }
  if (segment?.kind === "payment") {
    const pay = segment.value === "yearly" ? "yearly" : "monthly";
    return `${subject} for ${pay} payment in ${loc}.`;
  }
  if (segment?.kind === "amenity") {
    const amenityLabel = (segment.value as string).replace(/-/g, " ");
    return `${subject} with ${amenityLabel} in ${loc}.`;
  }
  if (segment?.kind === "subArea" && area === "ubud") {
    return ubudSubAreaIntro[segment.value as SubArea];
  }
  return `Browse our curated selection in ${loc}.`;
}

export function buildDescription(
  type: CatalogTypeForSeo,
  area?: MainArea,
  subArea?: SubArea,
  segment?: { kind: string | null; value: string | number }
): string {
  if (type === "villas" && !segment) {
    if (area) {
      const areaDesc = area ? resolveAreaSeoDescription(String(area)) : "";
      return areaDesc || `Browse villas for rent and sale in ${areaName(area)}. Find your next home or investment.`;
    }
    return "Browse all villas for rent and for sale in Bali—one catalogue, regularly updated. Long-term rentals and purchase options across Ubud, Canggu, Sanur, Seminyak and more.";
  }
  if (type === "land" && !segment) {
    if (area) {
      const areaDesc = area ? resolveAreaSeoDescription(String(area)) : "";
      return (
        areaDesc ||
        `Buy land in ${areaName(area)}. Curated land listings with context on building or holding plots—research land leasehold, land freehold, and land for lease in Bali with your lawyer before you transfer.`
      );
    }
    return "Buy land in Bali: curated plots for building or investment. Compare land for sale with how land for lease in Bali works, and learn how land leasehold vs land freehold framing affects foreign and domestic buyers—always confirm title on file with a notary.";
  }
  if (type === "business" && !segment) {
    if (area) {
      const areaDesc = area ? resolveAreaSeoDescription(String(area)) : "";
      return (
        areaDesc ||
        `Buy a business in ${areaName(area)}. Commercial and hospitality listings in our Bali catalogue—verify licensing, leases, and operations with qualified advisers.`
      );
    }
    return "Buy a business in Bali: commercial property and hospitality listings in one place. Shortlist guesthouses, permitted villas, and operator-ready assets—then validate every claim with local legal and tax professionals.";
  }
  if (type === "hotels" && !segment) {
    if (area) {
      const areaDesc = area ? resolveAreaSeoDescription(String(area)) : "";
      return (
        areaDesc ||
        `Find space for retreats in ${areaName(area)}: retreat hotels, venue complexes, and group-stay properties for facilitators and organizers. Compare yoga shalas, pools, room counts, and access before you book dates.`
      );
    }
    return "Space for retreats in Bali: retreat hotels, venue complexes, and group accommodation for yoga retreats, workshops, and wellness programs. Search hotels for retreats in Ubud and beyond—capacity, shalas, pools, and quiet settings for your group.";
  }
  const subject = (subjectByType[type] ?? "villas").toLowerCase();
  const loc = area ? areaName(area) : "Bali";
  const areaDesc = area ? resolveAreaSeoDescription(String(area)) : "";

  if (segment?.kind === "bedroom") {
    if (type === "rent" && area === "ubud") {
      const n = Number(segment.value);
      if (n >= 1 && n <= 4) {
        return `Find ${n}-bedroom villas for rent in Ubud. Explore monthly and yearly rental options across Penestanan, Lodtunduh, Petulu, and other Ubud areas. Filter by pool, enclosed kitchen, and more to match your long-term stay needs.`;
      }
    }
    return `Find ${segment.value} bedroom ${subject} for ${type} in ${loc}. ${areaDesc || `Browse our curated selection of properties in ${loc}.`}`;
  }
  if (segment?.kind === "payment") {
    const pay = segment.value === "yearly" ? "yearly" : "monthly";
    return `Browse ${subject} available for ${pay} payment in ${loc}. ${areaDesc || ""}`;
  }
  if (segment?.kind === "amenity") {
    const amenityLabel = (segment.value as string).replace(/-/g, " ");
    return `Find ${subject} with ${amenityLabel} in ${loc}. ${areaDesc || ""}`;
  }
  if (segment?.kind === "subArea") {
    const sa = subArea!;
    const intro = ubudSubAreaIntro[sa];
    return `${intro} Find ${subject} for ${type} in ${subAreaNames[sa]}, ${loc}. ${areaDesc || ""}`.trim();
  }
  if (area) {
    return areaDesc || `Find ${subject} in ${loc}. Browse our curated listings.`;
  }
  if (type === "rent") {
    return "Villas for rent in Bali: long-term listings with clear filters. Rent a villa in Bali for a month or more—by area, bedrooms, pool, enclosed living, payment terms and more.";
  }
  if (type === "sale") {
    return "Villas for sale in Bali in one curated catalogue. Buy a villa in Bali with realistic context—freehold and leasehold options in Ubud, Canggu, Seminyak, Tanah Lot and beyond.";
  }
  if (type) {
    return `Browse ${subject} in Bali. Find properties across Ubud, Canggu, Sanur and more.`;
  }
  return "Explore a curated selection of Bali properties including villas for rent, land plots, and investment opportunities. Discover homes across Ubud, Canggu, Seminyak and other Bali locations.";
}

/** Unique SEO texts for level-1 type-only pages (e.g. /properties/rent, /properties/sale, /properties/villas). */
const seoTextByType: Record<string, string> = {
  rent: `Looking for a villa to rent in Bali? This page lists private villas available for long-term rental across the island — from Ubud and the central highlands to coastal areas like Canggu, Seminyak and Sanur. All listings are verified and suitable for stays of one month or more. You can filter by area, number of bedrooms, payment terms (monthly or yearly) and amenities such as private pool, enclosed kitchen, bathtub or nature view. Whether you need a one-bedroom for remote work or a family villa with several bedrooms, our catalog helps you find a rental that fits your budget and lifestyle.`,
  sale: `Interested in buying a villa or house in Bali? Here you can browse villas for sale across the island. Our listings include freehold and leasehold options in popular areas like Ubud, Canggu, Seminyak and Tanah Lot. Use the filters to narrow by location, size and features. Buying property in Bali involves specific legal and permit requirements; we recommend consulting our guides and specialists before making a decision.`,
  villas: `Looking for a villa in Bali — to rent or to buy? This hub lists all villas available for both long-term rental and purchase across the island. You can choose monthly or yearly rent where offered, or explore purchase options. Filter by area (Ubud, Canggu, Sanur, Seminyak, Tanah Lot), bedrooms, and amenities such as pool, bathtub or enclosed kitchen. Whether you plan to rent for a few months or invest, our catalogue helps you find the right villa.`,
  land: `Buy land in Bali through this growing catalogue of plots we list as available for purchase or structured acquisition. Compare how land for lease in Bali differs from fee-simple expectations elsewhere, and study land leasehold versus land freehold language with your notary—not with blog posts alone. Locations span Ubud hills to coastal zones; always verify zoning, access, and certificates on file before you commit.`,
  business: `Buy a business in Bali starts with separating glossy photos from permits, leases, and operating reality. This section lists commercial and hospitality-oriented assets we track—guesthouses, larger pool villas with stay permits where stated, and similar concepts. Match each opportunity to how you want to run operations, then validate every claim with local legal and tax advisers.`,
  hotels: `Looking for space for retreats in Bali or a hotel for retreats in Ubud? This section lists retreat-oriented venues we track—properties with room blocks, yoga shalas, pools, and quiet settings suited to facilitators, coaches, and retreat organizers. Compare capacity, location, and on-site amenities, then reach out for availability and pricing for your program dates. Whether you run yoga retreats, breathwork intensives, or corporate offsites, start here before you commit to a venue contract.`,
};

/**
 * Multi-paragraph SEO footer for type hub pages: /properties/villas, /rent, /sale, /land, /business.
 * Other area pages use {@link buildTypeAreaFooterParagraphs} or {@link buildSeoText}.
 */
export function buildTypeHubFooterParagraphs(type: CatalogTypeForSeo): string[] | null {
  if (type === "villas") {
    return [
      "If you are looking for a villa in Bali—to rent for a longer stay or to buy—this hub lists every villa currently in our public catalogue. Listings combine long-term rental options (monthly or yearly where offered) with properties offered for purchase, so you can compare approaches in one place rather than jumping between separate directories.",
      "Filter by area such as Ubud, Canggu, Sanur, Seminyak or Tanah Lot, by number of bedrooms, by rental or payment preferences, and by amenities including private pool, bathtub, enclosed kitchen, enclosed living, nature views, garage or car park, desk space, and more. The goal is practical browsing: fewer surprises, clearer expectations.",
      "We update the catalogue as listings change and details are verified. Whether you already know Ubud well or are weighing hills against the coast, the same tools help you move from exploration to a manageable shortlist.",
    ];
  }
  if (type === "rent") {
    return [
      "Villas for rent in Bali are easy to find online—but hard to trust when photos, prices, and contract terms do not line up. This page focuses on long-term villas for rent in Bali: private homes suited to stays of one month or more, with information we aim to keep accurate and useful.",
      "When you decide to rent a villa in Bali, the right filters save time: choose an area and sub-area, bedroom count, monthly or yearly payment where available, and must-have features such as a pool, enclosed kitchen, high-speed Wi-Fi, bathtub, or nature views. Compare Ubud's jungle calm with coastal energy in Canggu, Seminyak, or Sanur depending on your routine.",
      "Renting long-term still means reading contracts carefully and confirming what is included—utilities, cleaning, pool maintenance, and deposit terms. Browse here at your own pace; if you want a curated shortlist or have fixed dates and budget, we can help you connect the dots between villas for rent in Bali and a place that actually fits how you want to rent a villa in Bali.",
    ];
  }
  if (type === "sale") {
    return [
      "Villas for sale in Bali range from compact one-bedroom homes to large multi-bedroom estates, across freehold and leasehold structures and many price bands. This catalogue highlights properties we represent with clear presentation—so you can compare seriously before engaging lawyers and notaries on the ground.",
      "If you plan to buy a villa in Bali, map your priorities first: location, land and building size, pool, enclosed living for climate control, views, parking, and whether the listing fits residential use, mixed use, or investment strategy. Use filters to narrow villas for sale in Bali by area and features, then review each detail page for pricing context and next steps.",
      "Purchasing property in Indonesia involves permits, ownership structures, and tax questions that vary by case. We recommend specialist legal advice before you commit. When you are still in research mode, use this page to understand what shapes the current market for villas for sale in Bali—and what it really takes to buy a villa in Bali with confidence.",
    ];
  }
  if (type === "land") {
    return [
      "If you plan to buy land in Bali, clarity on structure matters as much as location: many buyers compare land for sale with land for lease in Bali when a long lease fits budget or flexibility better than an outright purchase path. Land leasehold typically means a defined term (and negotiated extensions) for use or development; land freehold (hak milik) is uncommon for foreign individuals and usually requires structures your notary should explain in writing.",
      "Plots vary by slope, access, zoning (peruntukan), green-belt or rice-field proximity, and whether power and water are practical. This catalogue lists land we currently present with photos and pricing context—still, site visits, recent land searches, and survey checks beat any online summary.",
      "Search phrases like land for lease in Bali, land leasehold, and land freehold overlap in Google but point to different legal boxes on the ground. Use this page to shortlist, then run title, tax, permit, and village-level checks with qualified Bali professionals before you transfer funds.",
    ];
  }
  if (type === "business") {
    return [
      "To buy a business in Bali is rarely a simple handover: hospitality listings often combine commercial property with brand, bookings, staff, and capex you still owe after closing. Read pondok wisata or other permit stacks alongside P&L narratives—photos show design, not compliance.",
      "This hub lists opportunities we track today across the island. Match each asset to real demand in its neighborhood: Ubud, Canggu, Seminyak, Sanur, and the central highlands all behave differently for length of stay, rate strategy, and seasonality.",
      "Whether you search buy a business in Bali or commercial property for sale in Bali, diligence is the same: verify licenses, lease terms, transfer taxes, and seller claims with local legal and accounting advisers before you sign.",
    ];
  }
  if (type === "hotels") {
    return [
      "If you search space for retreats in Bali or hotel for retreats in Ubud, you are usually planning a group program—not a single holiday rental. This hub lists retreat-oriented venues we currently track: properties with multiple rooms or villas, yoga shalas, pools, and quiet settings that suit facilitators, coaches, and wellness organizers.",
      "Compare location (Ubud hills vs closer to town), total guest capacity, shala size, parking, Wi-Fi for hybrid sessions, and how far you are from airports and clinics. Photos help, but always confirm blackout dates, minimum stays, catering options, and noise rules before you sign a venue contract.",
      "We add venues as we verify details. If you are scouting a retreat hotel in Bali for an upcoming program, shortlist here first—then use Request to ask about availability, pricing, and whether the space fits your group size and schedule.",
    ];
  }
  return null;
}

/**
 * Multi-paragraph SEO footer for /properties/{land|business}/{area} (path-based area URLs).
 */
export function buildTypeAreaFooterParagraphs(
  type: CatalogTypeForSeo,
  area: MainArea
): string[] | null {
  if (type !== "land" && type !== "business" && type !== "hotels") return null;
  const loc = areaName(area);
  if (type === "land") {
    return [
      `${loc} attracts land buyers for different reasons—views, access, quiet, or proximity to tourism corridors. When you buy land in ${loc}, treat every listing as a starting point: confirm boundaries, access rights, and whether the seller frames the plot as land leasehold, land freehold for an eligible party, or another structure. Buyers comparing land for lease in Bali with an outright purchase should model total cost over the years they plan to hold, not only headline price.`,
      `Zoning and local rules can limit height, footprint, or use even when a plot looks ideal in photos. If you are researching land leasehold extensions or how land freehold certificates might relate to your nationality and entity setup, do that work with a notary and land specialist before you commit a deposit—online copy cannot replace a file review.`,
      `We refresh this catalogue as plots change. If you are early in your search for land in ${loc} or want help interpreting how land for lease in Bali compares to fee-simple-style expectations from other countries, use our guides or reach out via Request once you have a shortlist.`,
    ];
  }
  if (type === "hotels") {
    return [
      `Retreat organizers comparing space for retreats in ${loc} should weigh guest capacity, shala layout, road access for transfers, and how quiet the site stays during peak season. A hotel for retreats in ${loc} is not only bedrooms—it is the flow between sessions, meals, and rest.`,
      `Verify Wi-Fi for hybrid calls, pool and shala rules, generator backup if power cuts matter, and whether the owner allows your program format (silence days, music, late check-out). Contract terms for group blocks differ from single-villa rentals.`,
      `We update listings as venues change. If you need a tighter shortlist of retreat hotels in ${loc} or help checking availability for fixed dates, note your group size and program length in Request.`,
    ];
  }
  return [
    `Operators who want to buy a business in ${loc} should stress-test the story behind each listing: occupancy, rate mix, staff contracts, and what permits actually allow on site. Commercial property in ${loc} only works when the guest profile and seasonality in this area match how you plan to market and operate—not only how the photos look.`,
    `Listings may bundle real estate with goodwill, furniture, and channel accounts. Separately verify lease length, renewal clauses, landlord consent for assignment, and any seller financing claims. The phrase buy a business in Bali covers many shapes; make sure the one you pursue matches how you want to spend your time after closing.`,
    `We update listings as we verify details. If you need a tighter shortlist of commercial property in ${loc} or guidance on licensing before you buy a business in Bali, note your budget and timeline in Request and we will help you orient.`,
  ];
}

export function buildSeoText(
  type: CatalogTypeForSeo,
  area?: MainArea,
  subArea?: SubArea,
  segment?: { kind: string | null; value: string | number }
): string {
  if (type === "villas" && !segment) {
    if (area) return `${areaName(area)} is one of Bali's most sought-after areas for villas. Whether you want to rent or buy, this page lists villas in ${areaName(area)}. Use filters to narrow by bedrooms, payment terms and amenities. ${seoTextByType.villas}`;
    return seoTextByType.villas;
  }
  if (type === "land" && area && !segment) {
    return `Land in ${areaName(area)}: plots we list for buyers comparing land for sale with land for lease in Bali, and researching land leasehold vs land freehold—confirm every certificate with a notary before you transfer.`;
  }
  if (type === "business" && area && !segment) {
    return `Commercial listings in ${areaName(area)} for operators exploring buy a business in Bali and related commercial property searches—verify licensing and leases locally before you commit.`;
  }
  if (type === "hotels" && area && !segment) {
    return `Retreat venues in ${areaName(area)} for organizers searching space for retreats in Bali or a hotel for retreats in ${areaName(area)}—compare capacity, shalas, and group-stay options before you book dates.`;
  }
  const subject = (subjectByType[type] ?? "villas").toLowerCase();
  const loc = area ? areaName(area) : "Bali";
  const base = `Bali offers a wide range of real estate opportunities, from peaceful jungle villas in Ubud to modern coastal properties in Canggu and Seminyak. On this page you can browse a curated collection of properties available for ${type} across the island. Our listings include private villas, land plots and unique investment opportunities suitable for both long-term living and property investment. Use filters to explore properties by location, number of bedrooms, rental terms and amenities such as private pools, enclosed living areas or nature views. Whether you are searching for a quiet home in the hills of Ubud or a vibrant property near Bali's beaches, our listings provide a convenient starting point for your search.`;

  if (segment?.kind === "bedroom") {
    return `Looking for ${segment.value} bedroom ${subject} in ${loc}? This page lists all our ${segment.value}-bedroom properties available for ${type} in this area. Each listing includes photos, prices and key features. Use the filters to narrow your search by sub-area, amenities or rental terms. ${base}`;
  }
  if (segment?.kind === "payment") {
    const pay = segment.value === "yearly" ? "yearly" : "monthly";
    return `Browse ${subject} available for ${pay} payment in ${loc}. This selection includes properties that accept ${pay} rental terms. ${base}`;
  }
  if (segment?.kind === "amenity") {
    const amenityLabel = (segment.value as string).replace(/-/g, " ");
    return `Find ${subject} with ${amenityLabel} in ${loc}. This page shows properties that feature ${amenityLabel}. ${base}`;
  }
  if (segment?.kind === "subArea") {
    return `Discover ${subject} in ${subAreaNames[subArea!]}, ${loc}. This neighborhood offers a unique blend of local culture and modern convenience. ${base}`;
  }
  if (area) {
    return `${areaName(area)} is one of Bali's most sought-after areas. ${base}`;
  }
  if (type) {
    return seoTextByType[type] ?? base;
  }
  return base;
}
