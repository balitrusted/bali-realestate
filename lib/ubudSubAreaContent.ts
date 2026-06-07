import { subAreaNames } from "@/types/areas";
import type { SubArea } from "@/types/property";
import type { CatalogTypeForSeo } from "@/lib/seoTemplates";

export type UbudSubAreaMoneyPage = {
  intro: string;
  faqs: { q: string; a: string }[];
};

/** URL slug for catalog-linked neighborhood guides */
export function ubudAreaGuideSlug(subArea: SubArea): string {
  return `${subArea}-area-guide-ubud`;
}

export function ubudAreaGuidePath(subArea: SubArea): string {
  return `/guides/ubud/${ubudAreaGuideSlug(subArea)}`;
}

/**
 * Short client-facing intro under the H1 on /properties/{type}/ubud/{subArea}.
 */
export const ubudSubAreaIntro: Record<SubArea, string> = {
  gentong:
    "Gentong sits slightly off Ubud’s busiest strips—think quieter residential lanes, easy runs into central Ubud, and a mix of newer builds and established homes. Good if you want calm without feeling remote.",
  kedewatan:
    "Kedewatan is known for elevated views and breezy ridge-line settings above the valley—popular with people who like open outlooks and a slightly cooler feel than the lower town.",
  keliki:
    "Keliki is a greener, more spread-out side of Ubud—rice pockets, small lanes, and a slower rhythm. It suits longer stays when you want nature close by and do not mind a few extra minutes to the main hubs.",
  kemenuh:
    "Kemenuh blends village life with practical access—handy for day-to-day errands while still feeling like Ubud’s countryside. A solid pick for families and remote workers who want space and calm.",
  lodtunduh:
    "Lodtunduh sits just south of central Ubud on Jl. A.A. Gede Rai. The north is urban and close to town; the far south opens into rice and trees.",
  mas:
    "Mas is famous for wood carving and craft workshops, with a relaxed village feel between rice plots and small roads. It is a strong match for quiet long-term living while staying within easy reach of central Ubud.",
  peliatan:
    "Peliatan is one of the closest neighborhoods to central Ubud—an old, traditional pocket with developing villa lanes. From many villas you can walk to Pepito Market Peliatan; Yoga Barn and central Ubud are often 5–8 minutes by scooter (up to ~10 depending on the lane).",
  penestanan:
    "Penestanan is a walkable, creative neighborhood—cafés, studios, and a friendly expat rhythm. Choose it if you like village lanes, short scooter hops to yoga and dining, and a social but still Ubud-calm setting.",
  petulu:
    "Petulu is quieter and more residential, known for evening herons and open views in places. It fits renters who want peace, local rhythm, and a bit more room to breathe away from the busiest strips.",
  sayan:
    "Sayan sits along the dramatic Ayung valley—jungle outlooks, resort-adjacent calm, and iconic ridge views. Perfect when views and atmosphere matter as much as bedroom count.",
  sukawati:
    "Sukawati is more everyday Bali—markets, local traffic, and practical shopping nearby—while still feeding quickly into Ubud’s hills. Useful if you want value and connectivity alongside a private villa base.",
  tegallalang:
    "Tegallalang is postcard Ubud—famous terraces, scenic ridges, and a tourist corridor that still hides peaceful pockets. Great for views and inspiration; expect more variation in access and lane conditions.",
};

/** Optional stronger SEO title for catalog sub-area pages */
export const ubudSubAreaSeoTitle: Partial<Record<SubArea, string>> = {
  peliatan: "Villas for Rent in Peliatan, Ubud | Near Center & Pepito | Balitrusted",
};

/** Extra meta keywords for catalog sub-area pages */
export const ubudSubAreaSeoKeywords: Partial<Record<SubArea, string>> = {
  peliatan:
    "Peliatan Ubud, villa rent Peliatan, Pepito Peliatan, Yoga Barn, Ubud center, long-term rental, Empathy School",
};

const PELIATAN_CATALOG_FAQS = [
  {
    q: "Is Peliatan close to central Ubud?",
    a: "Yes—Peliatan is one of the nearest residential neighborhoods to central Ubud. Many errands are 5–8 minutes by scooter; some villas are walking distance to Pepito Market Peliatan.",
  },
  {
    q: "What is the main downside of living in Peliatan?",
    a: "The Pepito corridor can be a narrow, busy street with traffic jams and exhaust at peak times. Choose a villa set back from that through-road if that bothers you.",
  },
  {
    q: "Which areas are next to Peliatan?",
    a: "Lodtunduh and Mas are the closest neighboring pockets—useful references when you compare south/east Ubud options.",
  },
  {
    q: "Is there an area guide for Peliatan?",
    a: "Yes—read the Peliatan area guide in our Knowledge base (/guides/ubud/peliatan-area-guide-ubud) for daily life, the Pepito corridor trade-off, and comparisons with Lodtunduh and Mas.",
  },
];

const sharedClosing = (label: string) =>
  `Filter by bedrooms, rent or sale, payment terms where relevant, and amenities—pool, enclosed living, bathtub, nature views, and more. Each listing page shows pricing context and what we have verified so you can shortlist with confidence. If you are comparing ${label} with other Ubud neighborhoods, start here and widen to the main Ubud hub when you want the full island-wide catalogue.`;

export function ubudSubAreaFooterParagraphs(subArea: SubArea): string[] {
  const label = subAreaNames[subArea];

  if (subArea === "peliatan") {
    return [
      `${label} is among the most central-feeling Ubud neighborhoods: old and traditional in character, with newer villa pockets still opening. Long-term renters often choose it for Pepito Market Peliatan, fuel stations, good cafés, and quick runs to Yoga Barn or central Ubud—without living on the busiest monkey-forest lanes.`,
      `The trade-off is the main shopping corridor: a narrow road that can queue badly and carry exhaust at busy hours. Villas on quiet side lanes can still feel residential; always visit your exact access at rush hour.`,
      `On this page you can browse villas we list in ${label}—for rent on monthly or yearly terms where published. Compare with nearby Lodtunduh and Mas if you are shortlisting south/east Ubud.`,
      sharedClosing(label),
    ];
  }

  if (subArea === "mas") {
    return [
      `${label} combines craft heritage with residential calm—many visitors know it for artisans and galleries, while long-term renters appreciate the green edges and straightforward access toward Ubud center. Villas here range from compact one-bedroom setups to larger two- and three-bedroom homes, depending on what owners bring to market.`,
      `On this page you can browse properties we currently list in ${label}—for rent (monthly or yearly where offered) and for purchase when owners publish a sale price. We aim for clear photos and honest feature tags; still, visit in person when you can, and confirm utilities, access roads, and contract terms with qualified advisers before you commit.`,
      sharedClosing(label),
    ];
  }

  return [
    `${label} is one of Ubud’s named sub-areas—useful when you want search and maps to line up with how locals describe daily life, not only the word “Ubud.” Long-term renters and buyers often start with a neighborhood shortlist, then narrow by bedrooms, budget, pool, enclosed living, and commute time to the routines that matter for work and school.`,
    `On this page you can browse properties we currently list in ${label}—for rent (monthly or yearly where offered) and for purchase when owners publish a sale price. We aim for clear photos and honest feature tags; still, visit in person when you can, and confirm utilities, access roads, and contract terms with qualified advisers before you commit.`,
    sharedClosing(label),
  ];
}

/** Catalog FAQ block (also used for index eligibility via moneyPages) */
export function getUbudSubAreaMoneyPage(
  type: CatalogTypeForSeo,
  subArea: SubArea
): UbudSubAreaMoneyPage | null {
  if (type !== "rent" && type !== "villas") return null;
  const intro = ubudSubAreaIntro[subArea];
  const label = subAreaNames[subArea];

  if (subArea === "peliatan") {
    return { intro, faqs: PELIATAN_CATALOG_FAQS };
  }

  return {
    intro,
    faqs: [
      {
        q: `Why rent a villa in ${label}, Ubud?`,
        a: `${label} is a named Ubud pocket—filtering here keeps your search aligned with how locals describe the area, not only the word “Ubud.”`,
      },
      {
        q: "Can I filter by bedrooms and amenities?",
        a: "Yes—use bedrooms, pool, enclosed living, payment terms, and other tags on this page before you shortlist.",
      },
      {
        q: `Is there a neighborhood guide for ${label}?`,
        a: `See our ${label} area guide in the Knowledge base for daily life notes and links back to this catalog.`,
      },
    ],
  };
}
