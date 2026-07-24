import { subAreaNames } from "@/types/areas";
import type { SubArea } from "@/types/property";
import { ubudAreaGuidePath } from "@/lib/ubudSubAreaContent";

type Faq = { q: string; a: string };

function guidePath(subArea: SubArea): string {
  return ubudAreaGuidePath(subArea);
}

const BY_SUB_AREA: Record<SubArea, Faq[]> = {
  gentong: [
    {
      q: "Why rent a villa in Gentong, Ubud?",
      a: "Gentong offers quieter residential lanes and strong value for yearly 2-bedroom deals compared with central Ubud - good when you want green calm without feeling remote.",
    },
    {
      q: "Is Gentong close to central Ubud?",
      a: "Often yes by scooter - many lanes feed into central errands in roughly 8-15 minutes depending on your pin and traffic.",
    },
    {
      q: "Gentong vs Peliatan or Lodtunduh?",
      a: "Peliatan feels more central and walkable; Lodtunduh splits urban north vs green south. Gentong is often chosen for value and calmer scooter-lane living.",
    },
    {
      q: "Is there a Gentong area guide?",
      a: `Yes - see our Gentong area guide (${guidePath("gentong")}) for roads, noise, and price context.`,
    },
  ],
  kedewatan: [
    {
      q: "Why rent a villa in Kedewatan, Ubud?",
      a: "Kedewatan is west Ubud’s established luxury corridor - valley scale, breezy ridges, historic hotels, and practical runs toward Kintamani. New Pepito Kedewatan raised everyday shopping convenience.",
    },
    {
      q: "Is Kedewatan good for valley views?",
      a: "Yes - outlook and land size are core reasons people choose it. Always verify your villa is not blocked by future builds on neighboring plots.",
    },
    {
      q: "Kedewatan vs Sayan or Penestanan?",
      a: "Sayan is more expat-market practical; Penestanan is walkable and café-dense. Kedewatan is airier, more premium, and tied to the grand valley road and highland access.",
    },
    {
      q: "Is there a Kedewatan area guide?",
      a: `Yes - see our Kedewatan area guide (${guidePath("kedewatan")}) for Pepito, rafting access, noise, and rental trade-offs.`,
    },
  ],
  keliki: [
    {
      q: "What is Keliki like for long-term renters?",
      a: "Keliki is spread-out and green - slower village pace, open landscapes, and more distance to central Ubud hubs. It suits immersion over convenience.",
    },
    {
      q: "Is Keliki walkable?",
      a: "Some local walks exist, but errands are usually by scooter - plan like a village pocket, not a café hill.",
    },
    {
      q: "Keliki vs Tegallalang?",
      a: "Both lean scenery-first. Tegallalang has the famous terrace corridor; Keliki often feels quieter and less tour-bus dense on daily lanes.",
    },
    {
      q: "Is there a Keliki area guide?",
      a: `Yes - see our Keliki area guide (${guidePath("keliki")}) before you shortlist villas here.`,
    },
  ],
  kemenuh: [
    {
      q: "Is Kemenuh good for families?",
      a: "Often yes - residential rhythm, space, and practical access without living on the busiest central strips.",
    },
    {
      q: "Is Kemenuh walkable?",
      a: "Some local walks exist, but most residents use a scooter for groceries and central Ubud runs.",
    },
    {
      q: "Kemenuh vs Lodtunduh or Mas?",
      a: "Lodtunduh can offer larger garden villas farther south; Mas is greener craft-village character. Kemenuh often feels more central-access practical.",
    },
    {
      q: "Is there a Kemenuh area guide?",
      a: `Yes - see our Kemenuh area guide (${guidePath("kemenuh")}) for daily life and comparisons.`,
    },
  ],
  lodtunduh: [
    {
      q: "Why rent in Lodtunduh?",
      a: "Lodtunduh is south Ubud on the A.A. Gede Rai spine - close to town in the north, greener and farther south. Strong for Canggu-road logic and mixed urban-to-rice pockets.",
    },
    {
      q: "How far is Lodtunduh from central Ubud?",
      a: "Northern Lodtunduh is often 5-10 minutes by scooter; far-south villas can be 12-15 minutes - always check your exact lane.",
    },
    {
      q: "Lodtunduh vs Peliatan?",
      a: "Peliatan is nearest Pepito-walkable center; Lodtunduh trades that for south-Ubud space and west-exit convenience.",
    },
    {
      q: "Is there a Lodtunduh area guide?",
      a: `Yes - see our Lodtunduh area guide (${guidePath("lodtunduh")}) for north vs south character and roads.`,
    },
  ],
  mas: [
    {
      q: "Why rent a villa in Mas, Ubud?",
      a: "Mas combines craft-village heritage with residential calm - green edges, family-friendly 2-4 bed stock, and straightforward access toward central Ubud.",
    },
    {
      q: "Is Mas good for families?",
      a: "Often yes - quieter lanes, developing villa pockets, and schools and family services reachable by short scooter rides.",
    },
    {
      q: "Mas vs Lodtunduh or Gentong?",
      a: "Mas is leafier and more southern-village in feel; Lodtunduh is closer to the A.A. Gede Rai corridor; Gentong is often value-oriented.",
    },
    {
      q: "Is there a Mas area guide?",
      a: `Yes - see our Mas area guide (${guidePath("mas")}) for daily rhythm and rental notes.`,
    },
  ],
  pejeng: [
    {
      q: "Why rent a villa in Pejeng, Ubud?",
      a: "Pejeng is one of the greenest, most spacious east-Ubud pockets - rice fields, temple landscape, and more room between homes than denser hill villages.",
    },
    {
      q: "Is Pejeng convenient for daily errands?",
      a: "Less walkable than central Ubud - most groceries mean Pepito Andong or Delta Dewata by scooter or car. Choose it when privacy and nature matter more than café density.",
    },
    {
      q: "Pejeng vs Mas?",
      a: "Both are green and spacious east/south-east of town. Mas often has denser family villa supply and stronger school-run logistics; Pejeng leans more open landscape and privacy.",
    },
    {
      q: "Is there a Pejeng area guide?",
      a: `Yes - see our Pejeng area guide (${guidePath("pejeng")}) for atmosphere, roads, and rental notes.`,
    },
  ],
  peliatan: [
    {
      q: "Is Peliatan close to central Ubud?",
      a: "Yes - Peliatan is one of the nearest residential neighborhoods to central Ubud. Many errands are 5-8 minutes by scooter; some villas are walking distance to Pepito Market Peliatan.",
    },
    {
      q: "What is the main downside of living in Peliatan?",
      a: "The Pepito corridor can be a narrow, busy street with traffic jams and exhaust at peak times. Choose a villa set back from that through-road if that bothers you.",
    },
    {
      q: "Which areas are next to Peliatan?",
      a: "Lodtunduh and Mas are the closest neighboring pockets - useful references when you compare south/east Ubud options.",
    },
    {
      q: "Is there an area guide for Peliatan?",
      a: `Yes - read the Peliatan area guide (${guidePath("peliatan")}) for daily life, the Pepito corridor trade-off, and comparisons with Lodtunduh and Mas.`,
    },
  ],
  penestanan: [
    {
      q: "Why rent in Penestanan?",
      a: "Penestanan is walkable by Ubud standards - cafés, yoga, creative studios, and village lanes with a social long-stay rhythm.",
    },
    {
      q: "Is Penestanan hilly?",
      a: "Yes - steps, slopes, and narrow gangs are part of daily life. Confirm scooter parking, rain access, and night lighting on your lane.",
    },
    {
      q: "Penestanan vs Sayan?",
      a: "Penestanan is more walkable and café-dense; Sayan is more expat-market and supermarket practical with valley outlooks.",
    },
    {
      q: "Is there a Penestanan area guide?",
      a: `Yes - see our Penestanan area guide (${guidePath("penestanan")}) for road spines, clusters, and rental trade-offs.`,
    },
  ],
  petulu: [
    {
      q: "What is Petulu known for?",
      a: "Petulu is residential and calmer - evening herons, open views in places, and a Pepito Andong-close edge without central Ubud noise.",
    },
    {
      q: "Petulu vs Gentong?",
      a: "Both offer greener value north/east of center. Petulu adds heron-village character and a practical west link toward Jalan Cinta; Gentong is often more south-access value.",
    },
    {
      q: "Is Petulu good for remote work?",
      a: "Yes if the villa setup is strong - test Wi-Fi, enclosed living, and power backup; Petulu is not a coworking-dense hub.",
    },
    {
      q: "Is there a Petulu area guide?",
      a: `Yes - see our Petulu area guide (${guidePath("petulu")}) for roads, noise, and comparisons.`,
    },
  ],
  sayan: [
    {
      q: "Why do expats choose Sayan?",
      a: "Sayan balances valley calm with Sayan Market, a strong supermarket cluster, paths toward Penestanan, and easier south-road access than many north-east pockets.",
    },
    {
      q: "Where do you shop in Sayan?",
      a: "Daily produce at Sayan Market; weekly stock at Cocomart on the crossroads plus Pepito and Popular opposite.",
    },
    {
      q: "What villa sizes are common in Sayan?",
      a: "Most demand is for 2-3 bedrooms; one-bedroom villas exist but are less dominant than in café-hill micro-markets.",
    },
    {
      q: "Is there a Sayan area guide?",
      a: `Yes - see our Sayan area guide (${guidePath("sayan")}) for market rhythm, roads, and FAQ.`,
    },
  ],
  singakerta: [
    {
      q: "Where is Singakerta?",
      a: "Southwest Ubud - between Penestanan, Sayan, and the Campuhan valley, with green lanes and a calmer residential rhythm.",
    },
    {
      q: "Singakerta vs Penestanan?",
      a: "Penestanan is more walkable and café-dense; Singakerta is quieter and more residential while staying close to west-Ubud landmarks.",
    },
    {
      q: "Is Singakerta walkable?",
      a: "Some local walks exist, but daily errands are usually by scooter - similar to many west-Ubud villa pockets.",
    },
    {
      q: "Is there a Singakerta area guide?",
      a: `Yes - see our Singakerta area guide (${guidePath("singakerta")}) for atmosphere, roads, and rental notes.`,
    },
  ],
  sukawati: [
    {
      q: "Why consider Sukawati for a villa base?",
      a: "Sukawati is more everyday Bali - markets, local traffic, and value - while still feeding quickly into Ubud’s hills.",
    },
    {
      q: "Is Sukawati quiet?",
      a: "Market and main-road pockets can be busy by day; residential lanes set back from arterials are often calmer - verify at night.",
    },
    {
      q: "Sukawati vs central Ubud?",
      a: "You trade hill café walkability for space, value, and flatter errand logic - many residents scooter into Ubud for yoga and dining.",
    },
    {
      q: "Is there a Sukawati area guide?",
      a: `Yes - see our Sukawati area guide (${guidePath("sukawati")}) for local life and rental trade-offs.`,
    },
  ],
  tegallalang: [
    {
      q: "Why rent in Tegallalang?",
      a: "Tegallalang is scenery-first Ubud - terraces, ridges, and village pockets for renters who want nature close and accept more variation in access.",
    },
    {
      q: "Is Tegallalang convenient for daily errands?",
      a: "Less than central Ubud - plan scooter time to groceries, clinics, and social hubs; immersion is the trade-off.",
    },
    {
      q: "Tegallalang vs Keliki?",
      a: "Both are spread-out and green. Tegallalang has the famous terrace corridor; Keliki often feels quieter and more open-landscape.",
    },
    {
      q: "Is there a Tegallalang area guide?",
      a: `Yes - see our Tegallalang area guide (${guidePath("tegallalang")}) for access, noise, and prices.`,
    },
  ],
};

export function getUbudSubAreaCatalogFaqs(subArea: SubArea): Faq[] {
  return BY_SUB_AREA[subArea];
}

export function genericUbudSubAreaCatalogFaqs(subArea: SubArea): Faq[] {
  const label = subAreaNames[subArea];
  return [
    {
      q: `Why rent a villa in ${label}, Ubud?`,
      a: `${label} is a named Ubud pocket - filtering here keeps your search aligned with how locals describe the area, not only the word “Ubud.”`,
    },
    {
      q: "Can I filter by bedrooms and amenities?",
      a: "Yes - use bedrooms, pool, enclosed living, payment terms, and other tags on this page before you shortlist.",
    },
    {
      q: `Is there a neighborhood guide for ${label}?`,
      a: `See our ${label} area guide in the Knowledge base for daily life notes and links back to this catalog.`,
    },
  ];
}
