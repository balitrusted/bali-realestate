import type { Article } from "@/types/article";
import type { SubArea } from "@/types/property";
import { subAreaNames } from "@/types/areas";

export type AreaGuideConfig = {
  subArea: SubArea;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  intro: string;
  atmosphere: string;
  noise: string;
  roads: string;
  internet: string;
  prices: string;
  pros: string[];
  cons: string[];
  whoFor: string[];
  faqs: { q: string; a: string }[];
};

function li(items: string[]): string {
  return `<ul>${items.map((t) => `<li><p>${t}</p></li>`).join("")}</ul>`;
}

function buildAreaGuideHtml(c: AreaGuideConfig): string {
  const name = subAreaNames[c.subArea];
  const catalog = `/properties/rent/ubud/${c.subArea}`;
  const yearly = `${catalog}?minDuration=12`;
  const hub =
    "/guides/ubud/ubud-areas-and-surroundings-a-practical-guide-for-long-term-living";

  const faqBlock = c.faqs
    .map(
      (f) =>
        `<h3 class="heading">${f.q}</h3><p>${f.a}</p>`
    )
    .join("");

  return [
    `<p>${c.intro}</p>`,
    `<h2 class="heading">Atmosphere and daily rhythm</h2><p>${c.atmosphere}</p>`,
    `<h2 class="heading">Noise, ceremonies, and construction</h2><p>${c.noise}</p>`,
    `<h2 class="heading">Roads and access</h2><p>${c.roads}</p>`,
    `<h2 class="heading">Internet and remote work</h2><p>${c.internet}</p>`,
    `<h2 class="heading">Rental prices and value</h2><p>${c.prices}</p>`,
    `<h2 class="heading">Pros</h2>${li(c.pros)}`,
    `<h2 class="heading">Cons</h2>${li(c.cons)}`,
    `<h2 class="heading">Who ${name} is best for</h2>${li(c.whoFor)}`,
    `<h2 class="heading">FAQ</h2>${faqBlock}`,
    `<h2 class="heading">Villas for rent in ${name}</h2>`,
    `<p>Browse villas we currently list in ${name}—filter by bedrooms, pool, enclosed living, and payment terms on the catalog page.</p>`,
    `<ul>`,
    `<li><p><a href="${catalog}">Villas for rent in ${name}, Ubud</a></p></li>`,
    `<li><p><a href="${yearly}">Yearly rental villas in ${name}</a> (where yearly pricing is published)</p></li>`,
    `<li><p><a href="/properties/rent/ubud">All Ubud long-term rentals</a></p></li>`,
    `</ul>`,
    `<p>Not sure which Ubud pocket fits you? <a href="/request">Tell us your dates, budget, and priorities</a> and we can shortlist options.</p>`,
    `<p><a href="${hub}">← Ubud areas overview (Knowledge base)</a> · <a href="/guides/ubud">All Ubud guides</a></p>`,
  ].join("");
}

function toArticle(c: AreaGuideConfig): Article {
  const name = subAreaNames[c.subArea];
  const now = "2026-05-18T12:00:00.000Z";
  return {
    id: `article-ubud-area-${c.subArea}`,
    title: `${name}, Ubud: Area Guide for Long-Term Living`,
    slug: `${c.subArea}-area-guide-ubud`,
    category: "ubud",
    content: buildAreaGuideHtml(c),
    excerpt: c.excerpt,
    tags: ["ubud", c.subArea, "long-term rental", "area guide", "villa"],
    author: "Balitrusted Team",
    published: true,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
    seoTitle: c.seoTitle,
    seoDescription: c.seoDescription,
    seoKeywords: c.seoKeywords,
    allowComments: true,
    commentCount: 0,
  };
}

const AREA_GUIDES: AreaGuideConfig[] = [
  {
    subArea: "lodtunduh",
    excerpt:
      "Lodtunduh is Ubud’s “more space, slower days” pocket—larger plots, greener lanes, and plenty of long-term villas. Practical for families and remote workers who want calm without feeling stuck in the hills.",
    seoTitle: "Lodtunduh Ubud Area Guide: Long-Term Rentals & Daily Life | Balitrusted",
    seoDescription:
      "Lodtunduh near Ubud: space, calm, family-friendly long-term rentals. Noise, roads, internet, prices, and villas for rent in Lodtunduh.",
    seoKeywords: [
      "Lodtunduh Ubud",
      "Lodtunduh villa rent",
      "long-term rental Ubud",
      "annual villa Lodtunduh",
    ],
    intro:
      "If you want Ubud life with <strong>more garden, more privacy, and less lane density</strong>, Lodtunduh is often the first place that still feels residential. It is not central-walkable, but it is one of the stronger areas for <strong>long-term villa layouts</strong> (2–4 bedrooms, pools, enclosed living). The trade-off is simple: you gain space and quiet, and you accept scooter or car logic for daily errands.",
    atmosphere:
      "Days in Lodtunduh often feel slower and more spread out than the café hills. You get larger plots, more separation between houses, and a stronger “home base” feeling—especially if your villa has a real garden. It suits people who treat Ubud as a place to live, not a place to party every night.",
    noise:
      "Lodtunduh is often quieter in a residential sense, but <strong>not magically silent</strong>. Roosters, temple events, and construction on neighboring land still happen—Ubud is developing everywhere. The difference is density: fewer “everything on one lane” situations than the busiest central strips. Always check the exact lane during a viewing (morning and evening).",
    roads:
      "Most people use a scooter for groceries, school runs, and evenings out. Access roads vary: some lanes are smooth, others get slippery after rain. If you dislike riding at night, prioritize villas on well-lit access and ask how the lane behaves in wet season.",
    internet:
      "Remote work is common here, but <strong>internet quality is villa-specific</strong>. Test Wi‑Fi during viewing, ask about power backup, and prefer enclosed living if you work through rain season. Many families choose Lodtunduh because the house matters more than the café scene.",
    prices:
      "Prices depend on bedrooms, pool, enclosed living, and how finished the villa feels—not only the area name. Lodtunduh often offers strong space for money on longer stays. Compare monthly vs yearly when both are listed; yearly terms often reduce the effective monthly cost. Start with <a href=\"/properties/rent/ubud/lodtunduh\">current Lodtunduh listings</a>.",
    pros: [
      "More space and privacy than central Ubud pockets",
      "Strong supply of 2–4 bedroom long-term villas",
      "Calmer residential rhythm; popular with families",
      "Pepito Market Peliatan (short scooter ride) plus local warungs and minimarts",
    ],
    cons: [
      "Not walkable for daily life; scooter or car logic",
      "Micro-location matters for construction and road noise",
      "Evenings out usually mean a ride to central Ubud or south hubs",
    ],
    whoFor: [
      "Families who want gardens and separation between houses",
      "Remote workers who prioritize the villa setup over café density",
      "Long-stay renters (3–12+ months) who accept a short ride to “town”",
    ],
    faqs: [
      {
        q: "Is Lodtunduh good for long-term living in Ubud?",
        a: "For many people, yes—especially if your priority is space, greenery, and a slower rhythm rather than walking to every café. It works well for longer stays when you want a villa that feels like a home base.",
      },
      {
        q: "Is Lodtunduh quiet compared to central Ubud?",
        a: "Often quieter in a spread-out residential way, but not automatically silent. Check the exact lane during viewing and ask about nearby construction.",
      },
      {
        q: "How far is Lodtunduh from supermarkets and Ubud center?",
        a: "There is no Pepito in Lodtunduh itself. Most people ride to Pepito Market Peliatan (or other central Ubud supermarkets) for a full shop, use local warungs for top-ups, and allow extra time to Ubud center depending on traffic.",
      },
      {
        q: "What type of villas are common in Lodtunduh?",
        a: "You will see many 2–4 bedroom villas with pools and gardens, often aimed at long-term renters. Verify enclosed kitchen/living and internet on site.",
      },
    ],
  },
  {
    subArea: "penestanan",
    excerpt:
      "Penestanan is walkable, creative, and social by Ubud standards—cafés, yoga, studios, and village lanes without full central chaos. A strong pick for long-term renters who want community and convenience.",
    seoTitle: "Penestanan Ubud Area Guide: Walkable Living & Villa Rentals | Balitrusted",
    seoDescription:
      "Penestanan Ubud: creative village vibe, cafés, walkability. Long-term living, noise, access, costs, and rental villas in Penestanan.",
    seoKeywords: [
      "Penestanan Ubud",
      "Penestanan villa rent",
      "walkable Ubud",
      "long-term rental Penestanan",
    ],
    intro:
      "Penestanan is where many long-term renters land when they want <strong>“Ubud lifestyle” without committing to central noise</strong>. It is famous for a creative rhythm: cafés, yoga, small shops, and lanes you can move through on foot in parts. The catch: <strong>micro-location matters</strong>—two villas on the same hill can feel totally different depending on road noise, construction, and proximity to busy strips.",
    atmosphere:
      "Penestanan feels like a connected village: social but still Ubud-calm compared to coastal party zones. You can build routines—morning walk, café work session, yoga, scooter hop to central Ubud when needed.",
    noise:
      "Usually calmer than central Ubud, but not a silence guarantee. Construction cycles, roosters, and occasional event noise still appear. Penestanan’s “quiet” often means quieter than the center while still being social.",
    roads:
      "Walkable in many pockets, but expect steps, slopes, and dark lanes at night. Scooter trips are often short. Choose your villa after you walk the lane at the times you actually go out.",
    internet:
      "Strong area for remote workers because cafés and coworking culture are nearby, but <strong>test Wi‑Fi in the villa</strong>. Enclosed living helps in rain season; power backup is worth asking about.",
    prices:
      "Penestanan often sits slightly higher than value pockets like Mas because convenience and atmosphere are priced in. Still, deals exist—especially on yearly terms. Compare listings on <a href=\"/properties/rent/ubud/penestanan\">Penestanan villas for rent</a>.",
    pros: [
      "Walkable pockets; short hops to cafés and yoga",
      "Creative/expat-friendly community rhythm",
      "Good balance of nature and convenience",
    ],
    cons: [
      "Hills, steps, and uneven lanes—not flat city walking",
      "Premium micro-locations can be pricey",
      "Sound and construction vary street by street",
    ],
    whoFor: [
      "Couples and solo remote workers who want community",
      "People who want cafés and yoga without living in the busiest center",
      "Yoga practitioners, retreat guests, and wellness-focused long stays (studios and teachers are nearby)",
      "Creative people—artists, designers, writers—who like village lanes and a social-but-calm rhythm",
      "Renters who can handle slopes and scooter logic when needed",
    ],
    faqs: [
      {
        q: "Is Penestanan walkable for daily life?",
        a: "In many parts, yes—by Ubud standards. Expect lanes, steps, and sometimes dark paths at night.",
      },
      {
        q: "Is Penestanan good for remote work?",
        a: "It can be excellent if the villa has reliable internet and a workable indoor setup. Test Wi‑Fi during viewing.",
      },
      {
        q: "Is Penestanan quiet?",
        a: "Often calmer than central Ubud, but not guaranteed. Prioritize villas set back from main lanes.",
      },
      {
        q: "Who usually chooses Penestanan?",
        a: "Remote workers, yoga and retreat people, and creative residents who want community—cafés, studios, and walkable lanes—without full central chaos.",
      },
    ],
  },
  {
    subArea: "mas",
    excerpt:
      "Mas is one of Ubud’s greenest, fastest-growing residential pockets—craft-village roots, rice-field edges, and strong supply of 2–4 bedroom villas. Popular with families and couples with children; calmer than the café hills but still practical.",
    seoTitle: "Mas Ubud Area Guide: Green Family Living & Villa Rentals | Balitrusted",
    seoDescription:
      "Mas Ubud: green developing area, family-friendly villas (2–4 beds), schools nearby, craft village life. Long-term guide—noise, roads, prices, and rentals.",
    seoKeywords: [
      "Mas Ubud",
      "Mas villa rent",
      "family villa Ubud",
      "long-term rental Mas",
      "4 bedroom villa Mas",
    ],
    intro:
      "Mas is known for <strong>wood carving and workshops</strong>, but for long-term renters it is increasingly a <strong>green, developing residential corridor</strong> south-east of central Ubud. Many people describe it as one of the <strong>greenest pockets in Ubud that is still actively building</strong>—new villas, wider plots, and rice-field edges rather than lane-on-lane density. <strong>2–3–4 bedroom villas</strong> are what the market optimizes for here, and supply keeps growing.",
    atmosphere:
      "Mas feels like village life with momentum: craft showrooms on the main road, quieter residential lanes behind, and steady new construction aimed at families who want gardens and multiple bedrooms. It is less “scene” than Penestanan and more everyday-livable. Nearby <strong>Pejeng</strong> is also green and spacious, but Mas often wins on <strong>family logistics</strong> (school runs toward Peliatan/Lodtunduh) and the volume of newer family-sized villas.",
    noise:
      "Often more residential and less scene-heavy than central hills, but roosters, ceremonies, and construction still exist. Calm usually comes from layout and distance from busy roads—not from the area name alone.",
    roads:
      "Scooter logic is standard. Some lanes are pleasant for short walks, but groceries and evenings out usually mean a ride. Check access roads in rainy season.",
    internet:
      "Fine for remote work if the villa is set up for it—test speed, enclosed living, and backup power. Mas is not about café coworking density; it is about a good home base.",
    prices:
      "Mas is especially competitive for <strong>2–4 bedroom villas with pools and gardens</strong>—the layouts families actually want. Prices still depend on finish, outlook, and road access; premium design costs more everywhere. Compare monthly vs yearly on <a href=\"/properties/rent/ubud/mas\">Mas rental villas</a> and filter by bedroom count.",
    pros: [
      "Among the greenest, most actively developing residential areas in Ubud",
      "Strong supply of 2–3–4 bedroom long-term villas (new builds continue)",
      "Popular with families and couples with children",
      "Schools and kindergartens within practical scooter range",
      "Craft-village culture plus rice-field outlooks; calmer than café hills",
    ],
    cons: [
      "Active development—check neighboring plots for future construction",
      "Not a walk-to-every-café neighborhood",
      "Internet and comfort depend heavily on the specific villa",
      "Some lanes are dark or slippery at night",
    ],
    whoFor: [
      "Families and couples with children who want space, gardens, and calmer roads",
      "Renters looking for 2–3–4 bedroom villas (the most common Mas inventory)",
      "People comparing Mas vs Pejeng who want greener living with stronger villa supply and school access",
      "Remote workers who want a green home base over social density",
      "Long-stay renters prioritizing villa size and value balance",
    ],
    faqs: [
      {
        q: "Is Mas good for families with children?",
        a: "Often yes—Mas is one of the greener, faster-growing family pockets in Ubud, with many 2–4 bedroom villas. Kindergartens and schools within a practical scooter ride include Waldorf Bali Madu (Mas/Sayan area), Empathy School (Peliatan), and Bali Hati International School (Lodtunduh). Pejeng is also green and spacious, but Mas usually feels more practical for daily family logistics and newer villa supply.",
      },
      {
        q: "Is Mas good for long-term villa rental in Ubud?",
        a: "Yes, especially if you want greenery, multiple bedrooms, and village pace more than walk-to-every-café convenience.",
      },
      {
        q: "Is Mas quiet compared to Penestanan or central Ubud?",
        a: "Often yes—more residential and less scene-heavy—but verify the exact lane before signing. Development noise can still appear on neighboring land.",
      },
      {
        q: "What villa sizes are common in Mas?",
        a: "2–4 bedrooms with pools and gardens are the sweet spot—what families search for and what gets built most actively here.",
      },
      {
        q: "Do you need a scooter to live in Mas?",
        a: "For most people, yes—for groceries (e.g. Pepito Market Peliatan), school runs, and evenings out. Some lanes are walkable for short trips only.",
      },
    ],
  },
  {
    subArea: "gentong",
    excerpt:
      "Gentong is green, quiet north-east Ubud with some of the island’s best yearly deals on 2-bedroom villas in nature—often 120–150M IDR/year. Narrow scenic lanes = scooter life; ideal for solitude and adventure-minded renters.",
    seoTitle: "Gentong Ubud Area Guide: Value Villas in Nature & Yearly Rentals | Balitrusted",
    seoDescription:
      "Gentong Ubud: affordable 2-bed yearly villas in greenery, scooter-only lanes, yearly prices from ~120M IDR. Who it fits, access, and current listings.",
    seoKeywords: [
      "Gentong Ubud",
      "Gentong villa rent",
      "yearly rental Gentong",
      "cheap 2 bedroom villa Ubud",
      "long-term rental Gentong",
    ],
    intro:
      "Gentong sits north-east of central Ubud—<strong>deep green, spread-out, and full of villas tucked into rice and jungle edges</strong>. It is one of the few Ubud pockets where you can still find <strong>seriously affordable 2-bedroom villas in nature</strong>, especially on <strong>yearly contracts</strong>. The trade-off is access: many homes are reached only by <strong>narrow lanes on a scooter</strong>, often with beautiful, slightly “adventure” approaches rather than flat main-road driveways.",
    atmosphere:
      "Think village quiet, humid greenery, and a large inventory of similar 2-bed layouts hidden down parallel lanes. Gentong suits people who want <strong>seclusion and value</strong> more than walkable café culture. If you enjoy the ride home as part of the lifestyle—views, trees, a slower rhythm—it clicks. If you want to walk to dinner, look elsewhere.",
    noise:
      "Generally calmer than central zones, with the usual Bali caveats: roosters, ceremonies, and periodic construction. Proximity to roads toward Tegallalang can add motorbike noise on some lanes.",
    roads:
      "<strong>Scooter-first is the norm.</strong> A huge share of Gentong villas are reachable only via <strong>narrow village roads</strong>—sometimes scenic ridge or rice-field lanes that feel like part of the experience. Cars may not reach every property; even when they can, owners often prefer scooters for daily life. Test your exact lane in daylight and after rain, with the bike you will actually ride. Supermarket runs usually mean Pepito Andong or Delta Dewata on a scooter.",
    internet:
      "Treat internet like any Ubud villa decision: speed test, enclosed living, backup power. Gentong is not chosen for coworking density—it is chosen for the house, the price, and the green surroundings.",
    prices:
      "Gentong stands out for <strong>yearly value on 2-bedroom villas in nature</strong>. On yearly terms it is common to see <strong>roughly 120–150 million IDR per year</strong> (about 120, 130, 140, or 150M) for a 2-bed with pool in a green setting—price points that are <strong>very hard to match</strong> in Penestanan, Sayan, or central hills for the same bedroom count. Inventory is deep and many owners publish yearly rates. Always confirm what is included (cleaning, pool, electricity, internet). Filter yearly on <a href=\"/properties/rent/ubud/gentong?minDuration=12\">Gentong yearly rentals</a> or browse <a href=\"/properties/rent/ubud/gentong\">all Gentong listings</a>.",
    pros: [
      "Among Ubud’s best value for 2-bedroom villas surrounded by nature",
      "Large supply of yearly offers; 120–150M IDR/year for 2 beds is realistic here",
      "Greener, quieter feel than central Ubud",
      "Scenic lane access—appeals if you like “coming home through the green”",
      "Practical scooter access to Pepito Andong / Delta Dewata",
    ],
    cons: [
      "Most villas: scooter-only or scooter-practical access on narrow roads",
      "Not for people who dislike riding or need car-at-the-door daily",
      "Not walkable for errands or café culture",
      "Lane quality and rain grip vary—visit your exact road",
    ],
    whoFor: [
      "Confident scooter riders who are fine on narrow, scenic village lanes",
      "Couples who want solitude, nature, and strong yearly value on a 2-bed villa",
      "Long-stay renters hunting 120–150M IDR/year deals hard to find elsewhere in Ubud",
      "People who enjoy privacy and “adventure” approaches more than convenience density",
      "Remote workers with a solid home setup who rarely need walkable cafés",
    ],
    faqs: [
      {
        q: "Why is Gentong famous for cheap 2-bedroom yearly rentals?",
        a: "Large green inventory, competition between similar villas, and distance from premium hills keep yearly prices lower. Seeing 120–150 million IDR per year for a 2-bed in nature is common here and rare in many other Ubud pockets.",
      },
      {
        q: "Do I need a scooter in Gentong?",
        a: "For most villas, yes—many are reachable only via narrow lanes that are part of daily life, not an occasional shortcut. Test your lane before signing.",
      },
      {
        q: "Is Gentong good for long-term living?",
        a: "Yes, if you want green value and yearly pricing and you accept scooter-first access. Less ideal if you want flat walks to cafés or car-only logistics.",
      },
      {
        q: "How do you shop from Gentong?",
        a: "Most people ride to Pepito Andong, Delta Dewata, or central Ubud depending on habit.",
      },
      {
        q: "What should I check during a villa viewing?",
        a: "Lane access in rain, night riding comfort, neighbor construction, Wi‑Fi speed, and whether the yearly price includes utilities and pool care.",
      },
    ],
  },
  {
    subArea: "petulu",
    excerpt:
      "Petulu is Gentong’s greener cousin—closer to town and Pepito Andong, famous for herons and a slow traditional village rhythm. Less “exclusive” than Gentong, but better west links toward Jalan Cinta and Pyramids of Chi.",
    seoTitle: "Petulu Ubud Area Guide: Heron Village Living & Villa Rentals | Balitrusted",
    seoDescription:
      "Petulu Ubud: heron village, slow lanes, Pepito Andong access, vs Gentong. Long-term living, roads west to Jalan Cinta, prices, and villas.",
    seoKeywords: [
      "Petulu Ubud",
      "Petulu villa rent",
      "Petulu herons",
      "long-term rental Petulu",
      "Pepito Andong",
    ],
    intro:
      "Petulu feels <strong>similar to Gentong</strong> in spirit—green, residential, unhurried—but sits <strong>closer to “town” logistics</strong> and <strong>Pepito Andong</strong>. It is more <strong>traditional and tourist-facing</strong> because of the famous evening heron colony and the road visitors use to watch them. The village can feel <strong>a bit tight</strong>: crossing Petulu end-to-end takes time on slow lanes. Life here is <strong>very unhurried</strong>. Villa stock is a touch less “luxury/exclusive” than Gentong’s hidden-lane inventory, but Petulu wins on <strong>westbound access</strong>—you can ride straight toward <strong>Jalan Cinta</strong> and <strong>Pyramids of Chi</strong> without looping through Gentong’s north-east lanes.",
    atmosphere:
      "Mornings are slow; evenings bring the heron spectacle and occasional visitor traffic on the main viewing corridor. Petulu is village Bali with a known postcard hook—not a café hill, not a resort strip. Compared with Gentong it feels <strong>more lived-in and slightly more on the map</strong>, with a denser weave of lanes and a pace that rewards patience.",
    noise:
      "Residential lanes are often calm, but the <strong>heron road and tourist evenings</strong> add predictable activity. Roosters, ceremonies, and construction still apply. Set back from the main heron corridor if you want maximum quiet.",
    roads:
      "Still mostly <strong>scooter logic</strong> on narrow village roads, but Petulu is <strong>closer to Pepito Andong and Delta Dewata</strong> than many Gentong pockets. Distinct advantage: easy runs <strong>west toward Jalan Cinta, Campuhan-side hills, and Pyramids of Chi</strong>—useful if your routine mixes north Ubud errands with west Ubud wellness and walks. Crossing the village itself can feel long and slow; plan time, not just distance.",
    internet:
      "Good for remote work when the villa has enclosed living and reliable Wi‑Fi. Test during viewing; do not assume café backup nearby.",
    prices:
      "Often strong value on yearly stays, though Gentong still leads on the very lowest 2-bed yearly deals in deep green lanes. Petulu pricing reflects slightly more access and tourist familiarity. Compare on <a href=\"/properties/rent/ubud/petulu\">Petulu villas for rent</a> and filter yearly where published.",
    pros: [
      "Green, slow village life—similar vibe to Gentong but closer to Ubud errands",
      "Quick scooter access to Pepito Andong and Delta Dewata",
      "Famous heron evenings (unique atmosphere)",
      "Westbound links to Jalan Cinta and Pyramids of Chi—unlike Gentong’s north-east orientation",
      "Good for long-stay renters who want nature without feeling “far north”",
    ],
    cons: [
      "More traditional/tourist touch than Gentong because of heron traffic",
      "Village can feel cramped; end-to-end crossings take time",
      "Slightly less “exclusive” villa stock than Gentong’s hidden-lane market",
      "Not walkable for daily café life",
      "Heron corridor can add evening activity",
    ],
    whoFor: [
      "Renters who like Gentong’s green calm but want Pepito Andong closer and west Ubud within easy reach",
      "People who enjoy slow village rhythm and do not mind a famous local landmark nearby",
      "Couples and remote workers who accept scooter life on narrow lanes",
      "Long-stay guests who sometimes head west (Jalan Cinta, Pyramids of Chi) as well as into central Ubud",
    ],
    faqs: [
      {
        q: "Petulu vs Gentong—which should I choose?",
        a: "Both are green and slow. Gentong often feels more secluded and can win on the lowest yearly 2-bed deals in deep lanes. Petulu is closer to town and Pepito Andong, more traditional/tourist because of the herons, a bit tighter to cross, slightly less “luxury” inventory—but better if you want quick westbound access to Jalan Cinta and Pyramids of Chi.",
      },
      {
        q: "Why is Petulu famous?",
        a: "Evening white heron flights and the road visitors use to watch them—plus a calm rice-field village character.",
      },
      {
        q: "Is Petulu good for families?",
        a: "It can be, especially for space and calm. Check school and supermarket runs realistically—mostly scooter time.",
      },
      {
        q: "Can you reach Pyramids of Chi easily from Petulu?",
        a: "Yes—one of Petulu’s practical edges over Gentong is riding west toward Jalan Cinta and Pyramids of Chi without a long detour north-east.",
      },
    ],
  },
  {
    subArea: "kedewatan",
    excerpt:
      "Kedewatan is Ubud’s old-luxury west—historic hotels, the valley’s grand road past rice fields and rivers, rafting and quad trails, and a straight run toward Kintamani. New Pepito Kedewatan underlines the premium turn.",
    seoTitle: "Kedewatan Ubud Area Guide: Old Luxury, Valley & Kintamani Access | Balitrusted",
    seoDescription:
      "Kedewatan Ubud: old-money feel, Ayung valley road, Kintamani access, Pepito Kedewatan. Long-term living, views, prices, and villas.",
    seoKeywords: [
      "Kedewatan Ubud",
      "Kedewatan villa rent",
      "Pepito Kedewatan",
      "Kintamani from Ubud",
      "long-term rental Kedewatan",
    ],
    intro:
      "Kedewatan carries an <strong>older, established luxury feeling</strong>—less “new Bali Instagram” and more <strong>old money Ubud</strong>: legacy resorts, wide valley perspectives, and a sense that this corridor has mattered for decades. The area is tied to one of Ubud’s <strong>grandest, heaviest roads</strong>, running past <strong>colossal rice fields</strong>, rivers, rafting put-ins, quad-bike routes, and <strong>historic hotels</strong> people still talk about. For long-term renters it also means <strong>direct practical access toward Kintamani</strong>—the highland “pearl” many residents visit on weekends. The recently opened <strong>Pepito Kedewatan</strong> signals that premium direction: high-quality groceries and goods that were harder to source locally before.",
    atmosphere:
      "Kedewatan feels airy and established—ridge breezes, valley scale, and a slower prestige pace. Days can mix villa calm with valley activities (rafting, river viewpoints, rides into the hills). It suits people who want <strong>landscape drama and history</strong>, not village-lane bargain hunting.",
    noise:
      "Often calm at villa level, but the main valley corridor carries daytime traffic to activities and viewpoints. Weekends and holiday peaks can add movement toward rafting/ATV hubs. Choose set-back villas if you are sensitive to through-road hum.",
    roads:
      "The <strong>main Kedewatan road</strong> is the story—broad by Ubud standards, scenic, and busy with valley tourism infrastructure. Scooter or car both work on the corridor; villa lanes can still be steep. <strong>Kintamani-bound trips</strong> often start here without fighting central Ubud traffic. <strong>Pepito Kedewatan</strong> (newer, large-format) is now the anchor for premium shopping—previously residents relied on longer rides for the same product range.",
    internet:
      "Views do not guarantee great Wi‑Fi—test the villa. Enclosed living is valuable in breeze-heavy zones when rain blows through.",
    prices:
      "Premium by Ubud standards—views, land size, and “established west” positioning matter. Yearly deals exist but rarely match Gentong-style 2-bed bargains. Browse <a href=\"/properties/rent/ubud/kedewatan\">Kedewatan rentals</a>.",
    pros: [
      "Distinct old-luxury / established-resort atmosphere",
      "Iconic valley road—rice fields, rivers, rafting and quad access",
      "Historic hotel strip and mature landscape scale",
      "Strong route toward Kintamani highlands",
      "New Pepito Kedewatan—premium groceries closer than before",
      "Breezy ridges and spacious residential plots",
    ],
    cons: [
      "Premium pricing vs green-value pockets like Gentong",
      "Valley corridor tourism traffic in places",
      "Steep villa lanes; rain grip varies",
      "Not a walkable café neighborhood",
    ],
    whoFor: [
      "Renters who want established luxury vibes over raw village value",
      "People who use Kintamani and highland weekends regularly",
      "Couples and families who value views, space, and valley activities",
      "Residents who appreciate Pepito-level shopping without always riding to central Ubud",
      "Remote workers with a strong home setup who enjoy west Ubud scale",
    ],
    faqs: [
      {
        q: "What makes Kedewatan feel different from Gentong or Petulu?",
        a: "Kedewatan is more established and premium—historic valley hotels, the grand road, rafting/quad tourism, and Kintamani access. Gentong/Petulu are greener village-value pockets; Kedewatan is old-luxury west Ubud.",
      },
      {
        q: "Is Pepito Kedewatan new?",
        a: "Yes—recently opened and widely seen as raising convenience in the corridor, with product range that was harder to get locally before.",
      },
      {
        q: "Is Kedewatan good for Kintamani trips?",
        a: "Yes—many residents treat Kedewatan as a practical west-side base for highland runs without crossing all of central Ubud first.",
      },
      {
        q: "Is Kedewatan good for views?",
        a: "Yes—valley and rice-field scale is the point. Verify views are not blocked by future builds.",
      },
      {
        q: "What should I check before renting?",
        a: "Distance to the main valley road, night noise, rain access on your lane, Wi‑Fi speed, and whether enclosed living fits your work setup.",
      },
    ],
  },
  {
    subArea: "sayan",
    excerpt:
      "Sayan is classic Ubud expat territory—valley calm near Sayan Market, a trio of supermarkets (Cocomart, Pepito, Popular), Rusters café, padel, and shortcuts toward Penestanan. 2–3 bed villas dominate; the pocket keeps developing.",
    seoTitle: "Sayan Ubud Area Guide: Expat Classic, Market & Villa Rentals | Balitrusted",
    seoDescription:
      "Sayan Ubud: expat hub, Sayan Market, Cocomart/Pepito/Popular, Rusters, padel, Penestanan shortcuts. Long-term villas, access to Canggu road, and listings.",
    seoKeywords: [
      "Sayan Ubud",
      "Sayan villa rent",
      "Sayan Market Ubud",
      "expat Ubud",
      "long-term rental Sayan",
    ],
    intro:
      "Sayan is <strong>classic Ubud expat country</strong>—slightly aside from the noisiest center, but wired into daily life through <strong>Sayan Market</strong>, the area’s central <strong>produce market</strong> and one of the real hearts of west Ubud. The Ayung valley still defines the mood (green, airy, calmer than the main streets), yet Sayan is more <strong>practical</strong> than remote: a cluster of supermarkets, a famous café, new sport infrastructure, and paths—including a <strong>shortcut toward Penestanan</strong>. The corridor also sits closer to the <strong>Denpasar / Canggu road</strong>, which matters if you leave Ubud often. The area is <strong>gradually developing</strong>; inventory skews to <strong>2–3 bedroom villas</strong>, with some 1-bedroom options.",
    atmosphere:
      "Sayan mixes valley prestige with expat routines: market mornings, supermarket runs, Rusters meetups, padel sessions, then home to a villa lane. You will hear many languages in the shops and see long-stay faces year-round. It feels established but not frozen—new retail and villas still appear.",
    noise:
      "Usually calmer than central Ubud, but market mornings, supermarket traffic, and valley tourism can add daytime hum near the main crossroads. Villa lanes set back from the corridor are often peaceful—verify at night.",
    roads:
      "Scooter is default; car works on the main corridor. The <strong>Sayan crossroads</strong> is the anchor: <strong>Cocomart</strong> on the corner, with the newer <strong>Pepito</strong> and <strong>Popular</strong> supermarkets opposite—together they cover most weekly shopping. Numerous <strong>foot and scooter paths</strong> cut through to Penestanan and the hills. For south Bali, the <strong>Denpasar / Canggu axis</strong> is more convenient from here than from north-east pockets like Gentong.",
    internet:
      "Remote work is common among expats here—test villa Wi‑Fi and enclosed living; cafés like Rusters are backup, not your office.",
    prices:
      "Sayan is mid-to-upper Ubud for many 2–3 bed villas with valley outlooks, but yearly deals exist. One-bedrooms appear less often than family layouts. Browse <a href=\"/properties/rent/ubud/sayan\">Sayan villas for rent</a>.",
    pros: [
      "Established expat ecosystem—one of Ubud’s default long-stay addresses",
      "Sayan Market for fresh produce and local rhythm",
      "Supermarket triangle: Cocomart, Pepito, Popular at the crossroads",
      "Rusters and growing leisure (padel nearby)",
      "Paths and shortcuts toward Penestanan",
      "Practical access toward Denpasar and Canggu",
      "2–3 bedroom villas are the sweet spot; area still developing",
    ],
    cons: [
      "Crossroads can feel busy at peak times",
      "Premium valley villas still cost more than Gentong-value lanes",
      "Some villa access roads are steep or winding",
      "Not a single walkable “main street” like central Ubud",
    ],
    whoFor: [
      "Long-term expats who want Ubud classic with market + supermarket convenience",
      "Couples and families seeking 2–3 bedroom villas (plus some 1-bed options)",
      "People who split time between Ubud hills and trips toward Canggu/Denpasar",
      "Active residents who like padel, valley walks, and café culture (Rusters)",
      "Renters comparing Sayan vs Kedewatan who prefer expat infrastructure over raw valley tourism",
    ],
    faqs: [
      {
        q: "Why do so many expats choose Sayan?",
        a: "It balances valley calm with Sayan Market, a strong supermarket cluster, familiar cafés, paths toward Penestanan, and easier south-road access—without living in the busiest central lanes.",
      },
      {
        q: "Where do you shop in Sayan?",
        a: "Daily produce at Sayan Market; weekly stock at Cocomart on the crossroads plus Pepito and Popular opposite. Rusters is the well-known café anchor.",
      },
      {
        q: "Can you walk or ride to Penestanan from Sayan?",
        a: "Yes—many people use local paths and shortcuts by foot or scooter rather than looping through central Ubud.",
      },
      {
        q: "What villa sizes are common?",
        a: "Most demand is for 2–3 bedrooms; one-bedroom villas exist but are less dominant than in café-hill micro-markets.",
      },
      {
        q: "Sayan vs Penestanan?",
        a: "Penestanan is more walkable and yoga/café dense; Sayan is more expat-market-supermarket practical with valley outlooks and a developing villa stock.",
      },
    ],
  },
  {
    subArea: "tegallalang",
    excerpt:
      "Tegallalang is postcard Ubud—terraces, ridges, and village pace north of town. Best for renters who want nature and immersion, not maximum convenience.",
    seoTitle: "Tegallalang Ubud Area Guide: Rice Terraces & Long-Term Living | Balitrusted",
    seoDescription:
      "Tegallalang Ubud: terraces, scenery, village pace. What renters should expect—access, shops, noise, prices, villas.",
    seoKeywords: [
      "Tegallalang Ubud",
      "Tegallalang villa rent",
      "rice terrace Ubud",
      "long-term rental Tegallalang",
    ],
    intro:
      "Tegallalang is <strong>postcard Ubud</strong>—famous terraces, scenic ridges, and a tourist corridor that still hides peaceful pockets. Great for views and inspiration; expect more variation in access and lane conditions than central Ubud.",
    atmosphere:
      "Tegallalang suits renters who intentionally want <strong>village immersion</strong>—nature close, slower errands, and fewer “everything nearby” assumptions.",
    noise:
      "Tourist corridor pockets can be busier by day; residential lanes can still be calm. Construction and roosters remain normal Ubud variables.",
    roads:
      "Scooter or car is essential. Large supermarkets are not in the village core—plan rides to Pepito Andong / Delta Dewata.",
    internet:
      "Remote work is possible, but treat connectivity as villa-critical. Enclosed living helps during heavy rain.",
    prices:
      "Pricing spans budget village houses to view villas. Compare carefully on access and outlook. Listings: <a href=\"/properties/rent/ubud/tegallalang\">Tegallalang villas</a>.",
    pros: [
      "Iconic scenery and nature immersion",
      "Can offer strong privacy in residential lanes",
      "Good for renters who want “Ubud countryside”",
    ],
    cons: [
      "Convenience is lower than central/south Ubud",
      "Tourist traffic in some corridors",
      "Road and access quality varies widely",
    ],
    whoFor: [
      "Renters who prioritize nature over café density",
      "People comfortable with scooter logistics",
      "Long-stay guests who accept fewer walkable errands",
    ],
    faqs: [
      {
        q: "Is Tegallalang good for long-term living?",
        a: "Yes, for a specific lifestyle—immersion and nature—not for maximum convenience.",
      },
      {
        q: "Are there supermarkets in Tegallalang?",
        a: "Not large ones in the village core; most people ride to Andong/Delta Dewata or similar.",
      },
      {
        q: "Is Tegallalang noisy?",
        a: "Tourist corridors can be busy by day; residential lanes are often calmer. Verify your exact pocket.",
      },
      {
        q: "Tegallalang vs Lodtunduh?",
        a: "Lodtunduh is more south-residential and spacious; Tegallalang is more north-scenic and village-immersive.",
      },
    ],
  },
  {
    subArea: "keliki",
    excerpt:
      "Keliki is a quiet village pocket with open landscapes and slower pace—best for renters who want space and silence north-west of Ubud.",
    seoTitle: "Keliki Ubud Area Guide: Village Calm & Long-Term Rentals | Balitrusted",
    seoDescription:
      "Keliki Ubud: quiet village air, open landscapes. Long-term fit, roads, internet, costs, and villas for rent in Keliki.",
    seoKeywords: ["Keliki Ubud", "Keliki villa rent", "quiet Ubud", "long-term rental Keliki"],
    intro:
      "Keliki is a <strong>greener, more spread-out</strong> side of Ubud—rice pockets, small lanes, and a slower rhythm. It suits longer stays when you want nature close by and do not mind extra minutes to main hubs.",
    atmosphere:
      "Keliki feels like deliberate village living: fresh air, open landscapes, and fewer assumptions that anything is around the corner.",
    noise:
      "Often very calm in residential lanes, with standard Bali variables (roosters, ceremonies, construction).",
    roads:
      "Scooter or car for supermarkets and central Ubud. Lane quality varies; rainy-season checks help.",
    internet:
      "Plan connectivity villa-by-villa. Keliki is chosen for calm, not for coworking culture on your doorstep.",
    prices:
      "Can offer value compared to premium hills, depending on villa finish. See <a href=\"/properties/rent/ubud/keliki\">Keliki listings</a>.",
    pros: [
      "Quiet village atmosphere",
      "Nature-close living",
      "Often strong value for space",
    ],
    cons: [
      "Lower convenience than central Ubud",
      "Fewer walkable cafés",
      "Access roads can be remote-feeling",
    ],
    whoFor: [
      "Renters who want silence and immersion",
      "Remote workers with a strong home setup",
      "People comparing Keliki vs Gentong/Tegallalang",
    ],
    faqs: [
      {
        q: "Is Keliki good for long-term living?",
        a: "Yes, if you want village calm and accept scooter logistics for errands.",
      },
      {
        q: "Is Keliki far from Ubud?",
        a: "It can feel farther in time than on a map—verify commute to the places you will go weekly.",
      },
      {
        q: "Is Keliki good for remote work?",
        a: "It can be, if the villa internet and indoor setup are solid.",
      },
      {
        q: "Keliki vs Keliki walking trails?",
        a: "Some renters enjoy walks toward ridge routes; daily life still usually requires a scooter.",
      },
    ],
  },
  {
    subArea: "kemenuh",
    excerpt:
      "Kemenuh blends village life with practical access—handy for day-to-day errands while keeping Ubud’s countryside feel. Solid for families and remote workers.",
    seoTitle: "Kemenuh Ubud Area Guide: Residential Ubud & Villa Rentals | Balitrusted",
    seoDescription:
      "Kemenuh Ubud: practical residential pocket. Long-term guide—noise, roads, internet, prices, and villas in Kemenuh.",
    seoKeywords: [
      "Kemenuh Ubud",
      "Kemenuh villa rent",
      "long-term rental Ubud",
      "family villa Ubud",
    ],
    intro:
      "Kemenuh blends <strong>village life with practical access</strong>—handy for day-to-day errands while still feeling like Ubud’s countryside. A solid pick for families and remote workers who want space and calm without feeling stuck.",
    atmosphere:
      "Kemenuh feels residential and workable: less “hill café scene,” more everyday living with green edges nearby.",
    noise:
      "Usually moderate—quieter than the center but not guaranteed silent. Check neighbor plots and road position.",
    roads:
      "Scooter logic; access toward central Ubud and southern corridors is often straightforward compared to the most remote northern pockets.",
    internet:
      "Treat as villa-specific: test Wi‑Fi, enclosed living, and power backup for remote work.",
    prices:
      "Pricing depends on villa size and finish. Kemenuh can be practical value for families. Browse <a href=\"/properties/rent/ubud/kemenuh\">Kemenuh villas</a>.",
    pros: [
      "Practical residential feel",
      "Good for families and longer stays",
      "Often easier access than the most remote villages",
    ],
    cons: [
      "Not a dense walkable café hub",
      "Villa quality varies widely",
      "Construction can appear nearby",
    ],
    whoFor: [
      "Families wanting space and calmer roads",
      "Remote workers who want a practical home base",
      "Renters comparing Kemenuh vs Lodtunduh/Mas",
    ],
    faqs: [
      {
        q: "Is Kemenuh good for families?",
        a: "Often yes—space, calmer rhythm, and practical access are why people choose it.",
      },
      {
        q: "Is Kemenuh walkable?",
        a: "Some local walks exist, but errands are usually by scooter.",
      },
      {
        q: "How does Kemenuh compare to Lodtunduh?",
        a: "Both are residential; Lodtunduh often has more large garden villas, Kemenuh can feel more central-access practical.",
      },
      {
        q: "What should I verify on viewing?",
        a: "Road access, internet speed, enclosed living, and nearby construction.",
      },
    ],
  },
  {
    subArea: "sukawati",
    excerpt:
      "Sukawati offers everyday Bali rhythm—markets, local traffic, and more space east of Ubud. Useful if you want value and connectivity with a private villa base.",
    seoTitle: "Sukawati Ubud Area Guide: Local Life & Long-Term Rentals | Balitrusted",
    seoDescription:
      "Sukawati Ubud area: markets, local life, space. Long-term living—roads, noise, costs, and villas for rent in Sukawati.",
    seoKeywords: [
      "Sukawati Ubud",
      "Sukawati villa rent",
      "east Ubud living",
      "long-term rental Sukawati",
    ],
    intro:
      "Sukawati is <strong>more everyday Bali</strong>—markets, local traffic, and practical shopping—while still feeding quickly into Ubud’s hills. Useful if you want value and connectivity alongside a private villa base.",
    atmosphere:
      "Sukawati feels local and commercial in a daily-life way: less expat-hill aesthetic, more “living in Bali” rhythm.",
    noise:
      "Markets and main roads can add daytime noise; residential lanes can still be calm. Verify your exact pocket.",
    roads:
      "Roads are often flatter and more “town-like” than steep hill lanes—still scooter logic for most renters.",
    internet:
      "Fine for remote work if the villa is set up for it. Sukawati is chosen for practicality, not café coworking density.",
    prices:
      "Can offer strong value and larger plots compared to premium hills. Compare on <a href=\"/properties/rent/ubud/sukawati\">Sukawati listings</a>.",
    pros: [
      "Practical shopping and local markets",
      "Often good value for space",
      "Flatter-road feel than steep Ubud hills",
    ],
    cons: [
      "Less “Ubud postcard” atmosphere",
      "Traffic and market noise in some areas",
      "Farther from central Ubud café culture",
    ],
    whoFor: [
      "Renters who want value and practicality",
      "Families who accept a more local environment",
      "People who do not need walkable expat hills",
    ],
    faqs: [
      {
        q: "Is Sukawati still “Ubud”?",
        a: "It is an eastern Ubud-area pocket in our catalog—more local and market-oriented than the café hills.",
      },
      {
        q: "Is Sukawati good for long-term living?",
        a: "Yes, if you want space and practicality and you accept a different vibe than Penestanan.",
      },
      {
        q: "Is Sukawati noisy?",
        a: "Main road/market areas can be busy; residential lanes vary. Visit at the times you will be home.",
      },
      {
        q: "How do you commute to Ubud center?",
        a: "Most people ride; time depends on traffic and your lane access.",
      },
    ],
  },
];

export const ubudAreaGuideArticles: Article[] = AREA_GUIDES.map(toArticle);

/** Display order for neighborhood chips on /guides and /guides/ubud */
export const UBUD_AREA_GUIDE_SUBAREAS_ORDER: SubArea[] = AREA_GUIDES.map((g) => g.subArea);

const UBUD_HUB_ARTICLE_ID = "article-1768495278928";
const HUB_GUIDE_LINK_MARKER = "lodtunduh-area-guide-ubud";
const HUB_INSERT_BEFORE =
  '</ul><hr><h1 class="heading">Ubud Areas and Surroundings';

/** Inject catalog-linked area guides into the main Ubud hub article. */
export function patchUbudHubContent(content: string): string {
  if (content.includes(HUB_GUIDE_LINK_MARKER)) return content;
  const idx = content.indexOf(HUB_INSERT_BEFORE);
  if (idx === -1) return content;
  return (
    content.slice(0, idx) +
    "</ul>" +
    UBUD_AREA_GUIDE_HUB_LINKS_HTML +
    content.slice(idx + "</ul>".length)
  );
}

export const UBUD_AREA_GUIDE_HUB_LINKS_HTML = `<h2 class="heading">Area guides with current rental listings</h2>
<p>These Ubud neighborhoods have dedicated guides linked to villas we list in our catalog. Each page covers daily life, trade-offs, and FAQ—then points you to rentals in that sub-area.</p>
<ul>
<li><p><a href="/guides/ubud/lodtunduh-area-guide-ubud"><strong>Lodtunduh</strong></a> — space, gardens, family-friendly long-term villas</p></li>
<li><p><a href="/guides/ubud/penestanan-area-guide-ubud"><strong>Penestanan</strong></a> — walkable, creative, social-by-Ubud-standards living</p></li>
<li><p><a href="/guides/ubud/mas-area-guide-ubud"><strong>Mas</strong></a> — green, developing, family-friendly 2–4 bed villas</p></li>
<li><p><a href="/guides/ubud/gentong-area-guide-ubud"><strong>Gentong</strong></a> — green value, yearly 2-bed deals, scooter lanes</p></li>
<li><p><a href="/guides/ubud/petulu-area-guide-ubud"><strong>Petulu</strong></a> — heron village, Pepito Andong–close, west to Jalan Cinta</p></li>
<li><p><a href="/guides/ubud/kedewatan-area-guide-ubud"><strong>Kedewatan</strong></a> — old luxury, valley road, Kintamani access</p></li>
<li><p><a href="/guides/ubud/sayan-area-guide-ubud"><strong>Sayan</strong></a> — expat classic, Sayan Market, supermarket hub</p></li>
<li><p><a href="/guides/ubud/tegallalang-area-guide-ubud"><strong>Tegallalang</strong></a> — terraces, scenery, immersion-first living</p></li>
<li><p><a href="/guides/ubud/keliki-area-guide-ubud"><strong>Keliki</strong></a> — open landscapes and slower village pace</p></li>
<li><p><a href="/guides/ubud/kemenuh-area-guide-ubud"><strong>Kemenuh</strong></a> — practical residential countryside</p></li>
<li><p><a href="/guides/ubud/sukawati-area-guide-ubud"><strong>Sukawati</strong></a> — local markets, value, and space east of Ubud</p></li>
</ul>
<p>Areas such as <strong>Pejeng</strong>, <strong>Nyuh Kuning</strong>, <strong>Andong</strong>, and <strong>central Ubud</strong> are covered in the sections below. We add catalog-linked guides when we list villas in those pockets.</p>`;

export function enrichArticlesWithUbudAreaGuides(articles: Article[]): Article[] {
  const score = (a: Article) => {
    const updated = a.updatedAt ? Date.parse(a.updatedAt) : NaN;
    const created = a.createdAt ? Date.parse(a.createdAt) : NaN;
    return Number.isFinite(updated) ? updated : Number.isFinite(created) ? created : 0;
  };

  const byId = new Map(articles.map((a) => [a.id, a]));

  for (const guide of ubudAreaGuideArticles) {
    const existing = byId.get(guide.id);
    if (!existing || score(guide) >= score(existing)) {
      byId.set(guide.id, guide);
    }
  }

  const hub = byId.get(UBUD_HUB_ARTICLE_ID);
  if (hub) {
    byId.set(UBUD_HUB_ARTICLE_ID, {
      ...hub,
      content: patchUbudHubContent(hub.content),
    });
  }

  return Array.from(byId.values());
}
