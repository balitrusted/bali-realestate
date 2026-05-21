import type { MainArea, PropertyType, SubArea } from "@/types/property";
import { getUbudSubAreaMoneyPage } from "@/lib/ubudSubAreaContent";

type ParsedSegment = { kind: string | null; value: string | number };

export type MoneyFaq = { q: string; a: string };

export type MoneyPageContent = {
  intro: string;
  faqs: MoneyFaq[];
};

export type MoneyAreaHubContent = {
  intro: string;
  faqs: MoneyFaq[];
};

function moneyKey(type: PropertyType | "villas", area: MainArea, segment: ParsedSegment): string | null {
  if (segment.kind === "bedroom") {
    return `${type}:${area}:bedroom:${String(segment.value)}`;
  }
  if (segment.kind === "payment") {
    return `${type}:${area}:payment:${String(segment.value)}`;
  }
  if (segment.kind === "amenity") {
    return `${type}:${area}:amenity:${String(segment.value)}`;
  }
  if (segment.kind === "subArea" && area === "ubud") {
    return `${type}:${area}:subArea:${String(segment.value)}`;
  }
  return null;
}

const UBUD_RENT_MONEY_PAGES: Record<string, MoneyPageContent> = {
  "rent:ubud:bedroom:2": {
    intro:
      "2-bedroom villas are one of the most requested formats in Ubud for couples, small families, and remote-working pairs. On this page you can compare long-term options with a practical focus: layout efficiency, privacy, and budget fit. Use filters to narrow by sub-area, enclosed living, pool, pet policy, and payment structure. If monthly and yearly prices are both available, compare total annual cost and flexibility before deciding.",
    faqs: [
      {
        q: "Are these villas suitable for long-term stays?",
        a: "Yes. This page is focused on long-term rent inventory where monthly and/or yearly options are available.",
      },
      {
        q: "Can I filter 2-bedroom villas by pool or enclosed living?",
        a: "Yes. Use the amenity filters to narrow by pool, enclosed living, closed kitchen, and other practical features.",
      },
      {
        q: "How do I compare monthly vs yearly pricing?",
        a: "When both are listed, compare annualized total cost and contract flexibility, not only the monthly headline figure.",
      },
    ],
  },
  "rent:ubud:bedroom:3": {
    intro:
      "3-bedroom villas in Ubud are a strong fit for families, shared living, and guests who need extra workspace. This page helps you shortlist homes with enough room for everyday life, not just short stays. Check location depth inside Ubud, enclosed vs open living style, and practical amenities like parking and Wi-Fi. For long-term decisions, always compare total yearly spend and included services.",
    faqs: [
      {
        q: "Who typically rents 3-bedroom villas in Ubud?",
        a: "Mostly families, groups sharing a long-term lease, and tenants needing an extra office or guest room.",
      },
      {
        q: "Are all listings in central Ubud?",
        a: "Not necessarily. Use sub-area filters to target central locations or quieter edge-of-forest neighborhoods.",
      },
      {
        q: "What should I confirm before signing?",
        a: "Confirm inclusions (cleaning, pool care, utilities), internet reliability, and renewal terms in writing.",
      },
    ],
  },
  "rent:ubud:bedroom:4": {
    intro:
      "4-bedroom villas in Ubud are usually selected by larger families, multi-generational households, or groups planning long stays. These listings often vary a lot in layout quality and privacy between rooms, so compare floor plans and shared spaces carefully. This page is designed to simplify that process with direct filtering by features that matter day-to-day: pool, enclosed living, work setup, and neighborhood profile.",
    faqs: [
      {
        q: "Are 4-bedroom options common in Ubud?",
        a: "They are less common than 2-3 bedroom stock, so availability can change quickly.",
      },
      {
        q: "Do larger villas always mean better value?",
        a: "Not always. Compare total operating cost, condition, and inclusions, not only bedroom count.",
      },
      {
        q: "Can I shortlist only family-suitable layouts?",
        a: "Yes. Use amenities and sub-area filters, then review each listing page for practical layout details.",
      },
    ],
  },
  "rent:ubud:payment:monthly": {
    intro:
      "Monthly villas in Ubud are useful when you need flexibility without committing to a full-year structure from day one. This page groups listings that expose monthly rent terms, so you can compare options quickly by area, size, and amenity mix. If a yearly option also exists, check both scenarios before deciding. For many tenants, the best choice balances flexibility, not just headline price.",
    faqs: [
      {
        q: "Does monthly rent mean short-term tourist booking?",
        a: "No. These are still long-stay oriented listings, but priced with monthly payment visibility.",
      },
      {
        q: "Can monthly and yearly prices exist on the same listing?",
        a: "Yes. Many listings show both. Use them to compare flexibility vs longer-term discount.",
      },
      {
        q: "What is the main advantage of monthly terms?",
        a: "Flexibility while you validate area fit, commute pattern, and lifestyle before committing longer.",
      },
    ],
  },
  "rent:ubud:payment:yearly": {
    intro:
      "Yearly villas in Ubud usually offer better effective pricing when you are ready for a stable long-term setup. This page focuses on listings that explicitly publish yearly rent terms. Compare location, condition, and included maintenance items before committing. The strongest yearly deals are often the ones with clear contract terms and predictable running costs, not only the lowest sticker number.",
    faqs: [
      {
        q: "Why choose yearly over monthly in Ubud?",
        a: "Yearly terms often reduce effective cost and provide better planning certainty for long stays.",
      },
      {
        q: "What should be checked in a yearly contract?",
        a: "Renewal terms, deposit handling, maintenance responsibilities, and early-exit clauses.",
      },
      {
        q: "Can I still filter yearly listings by amenities?",
        a: "Yes. Combine yearly segment with pool, enclosed living, Wi-Fi, and other filters.",
      },
    ],
  },
  "rent:ubud:amenity:pet-friendly": {
    intro:
      "Pet-friendly villas in Ubud are a high-intent category with limited supply, so this page is designed for quick qualification. Beyond the pet flag itself, review layout practicality: enclosed zones, outdoor safety, and nearby walking conditions. If pets are critical for your move, shortlist fast and confirm terms directly in writing, including any breed/size rules and deposit expectations.",
    faqs: [
      {
        q: "Are all Ubud villas pet-friendly?",
        a: "No. Pet acceptance is limited and often conditional, so dedicated filtering matters.",
      },
      {
        q: "What pet conditions are commonly applied?",
        a: "Typical conditions include size limits, extra deposit, and owner approval before contract signing.",
      },
      {
        q: "Should I confirm pet policy in writing?",
        a: "Yes. Always confirm explicit pet permission and terms in the final agreement.",
      },
    ],
  },
  "rent:ubud:amenity:nature-view": {
    intro:
      "Nature-view villas in Ubud are chosen for atmosphere and long-term livability near greenery, valleys, and rice surroundings. This page helps you compare listings where view quality is a core feature. For serious selection, pair visuals with practical checks: access roads, seasonal humidity, and ambient sound profile. The best match is where view quality and everyday comfort both hold up.",
    faqs: [
      {
        q: "Does nature-view always mean rice-field view?",
        a: "Not always. It may include jungle, valley, river-edge, or mixed green outlooks.",
      },
      {
        q: "Are nature-view villas usually quieter?",
        a: "Often yes, but actual sound depends on nearby roads, events, and local activity patterns.",
      },
      {
        q: "What should I verify besides photos?",
        a: "Verify access quality, neighborhood rhythm, and weather/humidity impact for long-term comfort.",
      },
    ],
  },
  "rent:ubud:amenity:pool": {
    intro:
      "Private-pool villas in Ubud remain one of the most demanded long-term formats. This page consolidates pool-equipped options so you can compare value by size, area, and layout style. For realistic budgeting, check who covers pool servicing and water treatment in the contract. A clear maintenance setup usually matters more than just pool appearance in photos.",
    faqs: [
      {
        q: "Do all pool villas include pool maintenance?",
        a: "Not always. Confirm whether routine pool service is included in monthly/yearly terms.",
      },
      {
        q: "Is a pool worth it for long-term rent?",
        a: "For many tenants yes, but compare maintenance burden and total running cost before deciding.",
      },
      {
        q: "Can I combine pool with bedroom filters?",
        a: "Yes. Use bedroom and area filters to narrow pool listings to your target layout.",
      },
    ],
  },
  "rent:ubud:amenity:enclosed-living": {
    intro:
      "Enclosed-living villas in Ubud are often preferred for airflow control, noise reduction, and all-weather comfort. This page is for renters who want a more sealed indoor environment instead of fully open tropical layouts. Compare enclosed living together with kitchen style, bedroom count, and internet reliability. For long-term tenants, this combination is usually central to daily usability.",
    faqs: [
      {
        q: "Why choose enclosed living in Ubud?",
        a: "It often improves temperature control, comfort during rain, and overall indoor usability.",
      },
      {
        q: "Is enclosed living better for remote work?",
        a: "In many cases yes, especially when combined with stable Wi-Fi and a dedicated desk/work area.",
      },
      {
        q: "Can I filter enclosed living with monthly/yearly terms?",
        a: "Yes. Segment and amenity filters can be combined for a tighter shortlist.",
      },
    ],
  },
};

export function getMoneyPageContent(
  type: PropertyType | "villas",
  area: MainArea,
  segment: ParsedSegment
): MoneyPageContent | null {
  if (segment.kind === "subArea" && area === "ubud") {
    return getUbudSubAreaMoneyPage(type, segment.value as SubArea);
  }
  const key = moneyKey(type, area, segment);
  if (!key) return null;
  return UBUD_RENT_MONEY_PAGES[key] ?? null;
}

export function shouldIndexSegmentPage(
  type: PropertyType | "villas",
  area: MainArea,
  segment: ParsedSegment,
  resultsCount: number
): boolean {
  if (resultsCount === 0) return false;
  if (segment.kind === "subArea" && area === "ubud") {
    return getUbudSubAreaMoneyPage(type, segment.value as SubArea) !== null;
  }
  return getMoneyPageContent(type, area, segment) !== null;
}

const SANUR_HUB_PAGES: Partial<Record<`${PropertyType}:${MainArea}`, MoneyAreaHubContent>> = {
  "rent:sanur": {
    intro:
      "Sanur is one of the most stable long-stay areas for renters who want a calmer coastal rhythm, walkable daily services, and easier family logistics. This page groups long-term villa rental options in Sanur so you can compare layout, location pocket, and monthly vs yearly value quickly. If your priority is balance between beach access and predictable everyday life, Sanur is often shortlisted early.",
    faqs: [
      {
        q: "Is Sanur suitable for long-term villa rental?",
        a: "Yes. Sanur is commonly chosen for stable long-stay routines, family-friendly pace, and practical day-to-day access.",
      },
      {
        q: "How is Sanur different from Ubud for renters?",
        a: "Sanur is coastal and generally flatter/walkable, while Ubud offers more jungle-valley atmosphere and inland lifestyle.",
      },
      {
        q: "Should I compare monthly and yearly terms in Sanur?",
        a: "Yes. When both are available, compare total annual cost and flexibility before deciding.",
      },
    ],
  },
  "sale:sanur": {
    intro:
      "Sanur remains a consistent buy-zone for people who prioritize livability, coastal access, and steadier neighborhood dynamics over ultra-fast turnover markets. This page is your starting point for villa purchase options in Sanur. Compare not just price, but layout practicality, access quality, and ownership/legal fit for your specific plan.",
    faqs: [
      {
        q: "Is Sanur a good area to buy a villa in Bali?",
        a: "For many buyers, yes—especially those prioritizing long-term livability and established neighborhood infrastructure.",
      },
      {
        q: "What should I verify before buying in Sanur?",
        a: "Verify title/ownership structure, permits, access, and tax/legal implications with qualified local advisers.",
      },
      {
        q: "Can I use this page as a shortlist entry point?",
        a: "Yes. Start here, then narrow by layout and practical criteria before legal and financial due diligence.",
      },
    ],
  },
};

export function getMoneyAreaHubContent(
  type: PropertyType | "villas",
  area: MainArea
): MoneyAreaHubContent | null {
  if (type === "villas") return null;
  return SANUR_HUB_PAGES[`${type}:${area}`] ?? null;
}

