export type ServiceBlockId = "villa" | "welcome" | "settling" | "relocation" | "buying";

export type ServiceItem = {
  id: string;
  block: ServiceBlockId;
  name: string;
  tagline: string;
  includes: string[];
  priceUsd: number;
  priceIdr: number;
  popular?: boolean;
  partner?: boolean;
};

export type ServicePackage = {
  id: string;
  block: "relocation";
  name: string;
  tagline: string;
  includes: string[];
  priceUsd: number;
  priceIdr: number;
  popular?: boolean;
  /** Service ids bundled into this package (excluded from à la carte sum). */
  bundledServiceIds: string[];
};

export const SERVICE_BLOCKS: { id: ServiceBlockId; title: string; subtitle: string }[] = [
  {
    id: "villa",
    title: "Villa services",
    subtitle:
      "Fixed-fee help for renting in Bali — especially Ubud. Remote, live video, and on-site checks are three tiers of the same inspection (pick one in the calculator). No hidden landlord kickbacks.",
  },
  {
    id: "welcome",
    title: "Pre-arrival & welcome",
    subtitle: "Land smoothly before or right after you fly in.",
  },
  {
    id: "settling",
    title: "Settling-in essentials",
    subtitle: "Coordinated through trusted local partners — one reliable window via Balitrusted.",
  },
  {
    id: "relocation",
    title: "Relocation packages",
    subtitle: "Bundled support for nomads and families moving to Ubud.",
  },
  {
    id: "buying",
    title: "Buying & due diligence",
    subtitle: "For purchase and investment — legal and technical checks via specialists.",
  },
];

export const SERVICES: ServiceItem[] = [
  {
    id: "a1",
    block: "villa",
    name: "Remote Villa Reality Check",
    tagline: "Second opinion before you send a deposit.",
    includes: [
      "Review listing link, photos, and owner/agent messages",
      "Mold, construction noise, road access, Wi‑Fi, water, owner tone",
      "Cross-check with our Ubud area guides where relevant",
      "Written Go / Caution / Skip summary",
    ],
    priceUsd: 79,
    priceIdr: 1_250_000,
  },
  {
    id: "a2",
    block: "villa",
    name: "Live Video Walkthrough",
    tagline: "On-site visit with a live video call — the step up from a desk-only remote check.",
    includes: [
      "Everything in the remote check scope, done while you watch live",
      "30–45 minute video call (WhatsApp or Zoom)",
      "Same-day short written summary",
    ],
    priceUsd: 129,
    priceIdr: 2_050_000,
  },
  {
    id: "a3",
    block: "villa",
    name: "On-Site Essential Inspection",
    tagline: "Renter-focused visit — not a full structural engineering audit.",
    includes: [
      "1.5–2 hours on site: mold, AC, kitchen/bath, neighborhood, speed test",
      "15–25 photos; report within 24–48 hours",
      "Caretaker/owner interaction notes",
    ],
    priceUsd: 199,
    priceIdr: 3_150_000,
    popular: true,
  },
  {
    id: "a4",
    block: "villa",
    name: "Villa Shortlist Hunt",
    tagline: "5–8 curated options matched to your brief.",
    includes: [
      "30-minute briefing call",
      "Shortlist from Balitrusted catalog + wider market",
      "Price/area commentary and one revision round",
      "Fixed fee — we do not take commission from landlords",
    ],
    priceUsd: 349,
    priceIdr: 5_500_000,
    popular: true,
  },
  {
    id: "a5",
    block: "villa",
    name: "Rent Negotiation Support",
    tagline: "Improve terms once you have a target villa.",
    includes: [
      "Fair-rent sense-check for the area",
      "Negotiation with owner (English + Bahasa)",
      "Deposit, exit, and utilities checklist",
      "Optional success fee: 25–40% of verified savings (cap $500)",
    ],
    priceUsd: 249,
    priceIdr: 3_950_000,
  },
  {
    id: "a6",
    block: "villa",
    name: "Lease Contract Red-Flag Review",
    tagline: "Spot typical traps before you sign — not a full legal opinion.",
    includes: [
      "Review lease for term, deposit, maintenance, subletting",
      "Questions to ask the owner before signing",
      "Clear sign / renegotiate / walk-away recommendation",
    ],
    priceUsd: 299,
    priceIdr: 4_750_000,
  },
  {
    id: "a7",
    block: "villa",
    name: "Viewing Day Package",
    tagline: "See 6–10 villas efficiently while you are on the island.",
    includes: [
      "Route planning across areas",
      "Essential-level check at each stop",
      "Comparison table and top 1–2 pick by end of day",
    ],
    priceUsd: 449,
    priceIdr: 7_100_000,
  },
  {
    id: "a8",
    block: "villa",
    name: "Secure Move-In Package",
    tagline: "From shortlist to keys — our flagship rental bundle.",
    includes: [
      "Villa Shortlist Hunt",
      "Three on-site essential inspections",
      "Negotiation + lease red-flag review",
      "Move-in day handover: inventory photos and defect log",
    ],
    priceUsd: 899,
    priceIdr: 14_200_000,
    popular: true,
  },
  {
    id: "b1",
    block: "welcome",
    name: "Airport Transfer & Welcome Pack",
    tagline: "Denpasar airport to Ubud with SIM ready in the car.",
    includes: [
      "Air-conditioned minivan with meet-and-greet sign",
      "Local SIM registered to your passport with data loaded",
    ],
    priceUsd: 55,
    priceIdr: 870_000,
    partner: true,
  },
  {
    id: "b2",
    block: "welcome",
    name: "Scooter Rental Setup",
    tagline: "Reliable bike delivered to your villa — rental paid to the shop.",
    includes: [
      "Model match (e.g. Scoopy, NMAX)",
      "Paperwork check and delivery",
      "Two helmets included",
    ],
    priceUsd: 20,
    priceIdr: 320_000,
    partner: true,
  },
  {
    id: "b3",
    block: "welcome",
    name: "Cash Exchange Coordination",
    tagline: "Rupiah when you need it — through partners we already use.",
    includes: [
      "Intro to a verified exchanger (official receipt) or trusted courier to your villa",
      "Rate confirmed before you proceed",
      "Balitrusted coordination fee only — exchange at partner rates",
    ],
    priceUsd: 25,
    priceIdr: 400_000,
    partner: true,
  },
  {
    id: "c1",
    block: "settling",
    name: "Bank Account Opening Assistance",
    tagline: "Document prep and escort to a major local bank.",
    includes: [
      "Permata, Mandiri, BNI, or similar — subject to bank policy",
      "One coordinated visit; card collection when the bank allows",
    ],
    priceUsd: 85,
    priceIdr: 1_350_000,
    partner: true,
  },
  {
    id: "c2",
    block: "settling",
    name: "Indonesian Driving License Assistance",
    tagline: "Official SIM A / A+B process via licensed channels.",
    includes: [
      "Document checklist and appointment coordination",
      "Escort to Gianyar or Denpasar offices as applicable",
    ],
    priceUsd: 175,
    priceIdr: 2_750_000,
    partner: true,
  },
  {
    id: "c3",
    block: "settling",
    name: "Domicile Letter (SKTT) Assistance",
    tagline: "Banjar registration for bank, vehicles, and local admin.",
    includes: [
      "Banjar intro and paperwork for domicile letter",
      "Guidance on what to bring as a foreign resident",
    ],
    priceUsd: 140,
    priceIdr: 2_200_000,
    partner: true,
  },
  {
    id: "e1",
    block: "buying",
    name: "Property Legal Due Diligence",
    tagline: "Land title, chain, tax, and zoning — via partner lawyers.",
    includes: [
      "BPN title review, ownership chain, tax status",
      "Zoning / green-zone check for Ubud and surrounds",
      "Written risk report in English",
    ],
    priceUsd: 650,
    priceIdr: 10_300_000,
    partner: true,
  },
  {
    id: "e2",
    block: "buying",
    name: "Structural & Building Inspection",
    tagline: "Engineer-led check for buyers — roof, foundation, moisture.",
    includes: [
      "Partner inspection scaled to villa size",
      "Photos and priority defect list",
    ],
    priceUsd: 350,
    priceIdr: 5_500_000,
    partner: true,
  },
  {
    id: "e3",
    block: "buying",
    name: "Buy-Side Advisory Package",
    tagline: "Independent buyer representation for villa purchase.",
    includes: [
      "Brief, shortlist, and negotiation coordination",
      "Due diligence and inspection scheduling (E1 + E2)",
      "Success fee 1–1.5% or capped amount — agreed in writing",
    ],
    priceUsd: 2_500,
    priceIdr: 39_500_000,
  },
];

export const SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: "d1",
    block: "relocation",
    name: "Digital Nomad Essentials — Ubud",
    tagline: "Visa route, housing hunt, arrival basics.",
    includes: [
      "Visa pathway intro (E33G / C1 — government fees quoted separately)",
      "Villa Shortlist Hunt + up to 5 live showings",
      "Airport transfer & Welcome Pack",
      "Scooter setup (first month coordination)",
      "Bank account opening assistance",
    ],
    priceUsd: 1_290,
    priceIdr: 20_400_000,
    bundledServiceIds: ["a4", "b1", "b2", "c1"],
  },
  {
    id: "d2",
    block: "relocation",
    name: "Ubud Relocation Starter",
    tagline: "Plan, secure a villa, and settle with hands-on support.",
    includes: [
      "Discovery call and 4–6 week action plan",
      "Secure Move-In Package (shortlist → contract → handover)",
      "Visa intro to trusted agents",
      "30-day chat support for everyday questions",
    ],
    priceUsd: 1_490,
    priceIdr: 23_500_000,
    popular: true,
    bundledServiceIds: ["a8", "a4", "a3", "a5", "a6"],
  },
  {
    id: "d3",
    block: "relocation",
    name: "Family Relocation — Ubud",
    tagline: "Schools, family villa, visas, and household setup.",
    includes: [
      "Family visa / KITAS coordination (fees separate)",
      "School tour intros (Green School, Pelangi, Wood School, etc.)",
      "Family villa search + lease review",
      "Car rental intro, insurance intro, staff intro",
      "Secure Move-In–level villa support",
    ],
    priceUsd: 3_200,
    priceIdr: 50_500_000,
    bundledServiceIds: ["a8", "a4", "a3", "a5", "a6", "b1", "b2", "c1", "c2", "c3"],
  },
];

export const CONCIERGE_ADDON: ServiceItem = {
  id: "d4",
  block: "relocation",
  name: "90-Day Concierge Add-on",
  tagline: "Extra month-by-month support after you land.",
  includes: [
    "Limited monthly hours for practical questions",
    "Coordination for ad-hoc partner services",
    "Best added to Relocation Starter or Family packages",
  ],
  priceUsd: 450,
  priceIdr: 7_100_000,
};

export const INSPECTION_CHECKLIST: string[] = [
  "Mold, damp smells, ventilation, and AC performance",
  "Construction noise morning / evening; temples, bars, roosters",
  "Road quality, parking, scooter access, rainy-season flooding",
  "Wi‑Fi speed test and mobile signal",
  "Hot water, kitchen gas, water pressure",
  "Owner and caretaker communication style",
  "Match with Ubud sub-area lifestyle (see our area guides)",
  "Deposit, exit terms, and what utilities are included",
];

export const SERVICES_DISCLAIMER =
  "All prices are fixed Balitrusted service fees. Visa government charges, property rent, vehicle rental, insurance, school tuition, and partner pass-through costs are quoted separately before you confirm.";

export function serviceById(id: string): ServiceItem | undefined {
  if (id === CONCIERGE_ADDON.id) return CONCIERGE_ADDON;
  return SERVICES.find((s) => s.id === id);
}

export function packageById(id: string): ServicePackage | undefined {
  return SERVICE_PACKAGES.find((p) => p.id === id);
}

export function formatServicePrice(usd: number, idr: number): string {
  return `$${usd.toLocaleString("en-US")} · ${(idr / 1_000_000).toFixed(2).replace(/\.00$/, "")}M IDR`;
}
