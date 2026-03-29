import { subAreaNames } from "@/types/areas";
import type { SubArea } from "@/types/property";

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
    "Lodtunduh is one of Ubud’s practical “south” pockets—often quicker access toward clubs and main roads, with plenty of newer long-term rentals. Ideal if you want convenience plus a residential vibe.",
  mas:
    "Mas is famous for wood carving and craft workshops, with a relaxed village feel between rice plots and small roads. It is a strong match for quiet long-term living while staying within easy reach of central Ubud.",
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

const sharedClosing = (label: string) =>
  `Filter by bedrooms, rent or sale, payment terms where relevant, and amenities—pool, enclosed living, bathtub, nature views, and more. Each listing page shows pricing context and what we have verified so you can shortlist with confidence. If you are comparing ${label} with other Ubud neighborhoods, start here and widen to the main Ubud hub when you want the full island-wide catalogue.`;

export function ubudSubAreaFooterParagraphs(subArea: SubArea): string[] {
  const label = subAreaNames[subArea];
  const intro =
    subArea === "mas"
      ? `${label} combines craft heritage with residential calm—many visitors know it for artisans and galleries, while long-term renters appreciate the green edges and straightforward access toward Ubud center. Villas here range from compact one-bedroom setups to larger two- and three-bedroom homes, depending on what owners bring to market.`
      : `${label} is one of Ubud’s named sub-areas—useful when you want search and maps to line up with how locals describe daily life, not only the word “Ubud.” Long-term renters and buyers often start with a neighborhood shortlist, then narrow by bedrooms, budget, pool, enclosed living, and commute time to the routines that matter for work and school.`;

  return [
    intro,
    `On this page you can browse properties we currently list in ${label}—for rent (monthly or yearly where offered) and for purchase when owners publish a sale price. We aim for clear photos and honest feature tags; still, visit in person when you can, and confirm utilities, access roads, and contract terms with qualified advisers before you commit.`,
    sharedClosing(label),
  ];
}
