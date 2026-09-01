/**
 * Future scheduler bank (phase 3). Humanized titles only, no em dashes.
 *
 * Style rules for new titles:
 * - Mix case: some start lowercase, some Title Case
 * - Punctuation: some with ?, some without; commas optional
 * - Tone: street/casual (u, pls, tbh), semi-formal, or mixed in one line
 * - Light typos or abbrev ok (2br, expat, wifi) but keep readable
 * - No long dashes (—); use commas or short sentences
 * - Relevant to Ubud villas, expats, rent/buy/services
 *
 * Each item must have a unique body (Extra detail) — no shared template phrases.
 */
export const QA_QUESTION_BANK: Array<{
  title: string;
  category: "rent" | "buy" | "services" | "living";
  body: string;
}> = [
  {
    category: "rent",
    title: "3 bedroom villa ubud quiet area budget?",
    body: "family of four, need something away from monkey forest traffic but not totally isolated. whats realistic monthly?",
  },
  {
    category: "rent",
    title: "Is 18jt/month realistic for 2br with pool penestanan",
    body: "found a place on fb at that price, seems too good. penestanan side, small pool, furnished.",
  },
  {
    category: "rent",
    title: "minimum lease villa bali usually how many months",
    body: "employer might relocate us after summer, dont want to lock 12 months if we can avoid it.",
  },
  {
    category: "rent",
    title: "scooter parking at most ubud villas or need to ask",
    body: "two of us will have bikes daily. do villas usually have covered parking or is it street only?",
  },
  {
    category: "rent",
    title: "lodtunduh vs tegalalang for long stay which better",
    body: "want rice fields and quiet but still need grab and a decent warung nearby. which area feels less cut off?",
  },
  {
    category: "rent",
    title: "AC included in rent or extra bill typical?",
    body: "listing says AC in every room but contract draft has nothing about electricity cap. whats normal?",
  },
  {
    category: "rent",
    title: "how to avoid scam listings facebook bali villas",
    body: "seen a few places with same photos under different prices. any red flags before i send a deposit?",
  },
  {
    category: "rent",
    title: "deposit 2 months normal? owner asking 6",
    body: "12 month lease, villa looks legit but six months upfront feels heavy. is that standard now?",
  },
  {
    category: "rent",
    title: "villa with rice field view ubud price range 2026",
    body: "not fussed about walking to yoga barn, happy to be 10-15 min scooter out if the view is real.",
  },
  {
    category: "rent",
    title: "guesthouse vs villa for 4 month stay solo",
    body: "working remote, dont need huge space but want pool access and privacy for calls. guesthouse ok or false economy?",
  },
  {
    category: "rent",
    title: "can negotiate rent if paying 6 months upfront",
    body: "landlord quoted 20jt, we can pay half year cash if it helps. do owners actually discount for that?",
  },
  {
    category: "rent",
    title: "pool guy and gardener who pays tenant or owner",
    body: "contract mentions weekly pool service but silent on who hires and pays the gardener. whats typical in ubud?",
  },
  {
    category: "rent",
    title: "off season discounts long term rental bali real?",
    body: "arriving october, heard rainy season means better deals. worth waiting or same prices year round?",
  },
  {
    category: "rent",
    title: "walking distance ubud center from sayan realistic daily",
    body: "we like to walk not scoot everywhere. is sayan hills to central ubud a daily thing or tourist myth?",
  },
  {
    category: "rent",
    title: "mosquito situation ubud villas need nets?",
    body: "kids react badly to bites. do most villas have nets or do we bring our own?",
  },
  {
    category: "rent",
    title: "2 kids school nearby penestanan options",
    body: "7 and 9 yo, probably local plus homeschool mix. what schools are actually reachable from penestanan?",
  },
  {
    category: "rent",
    title: "co living ubud vs private villa worth it",
    body: "solo for 6 months, budget flexible. coliving social scene vs own kitchen and quiet — whats better value?",
  },
  {
    category: "rent",
    title: "water filter needed ubud tap water villa",
    body: "landlord says tap ok for cooking after boiling. do expats bother with filters or just buy gallons?",
  },
  {
    category: "rent",
    title: "power outages how often ubud area",
    body: "need stable wifi for client calls. how bad are cuts in lodtunduh vs closer to town?",
  },
  {
    category: "buy",
    title: "PT PMA villa ownership still worth hassle 2026",
    body: "lawyer quoted setup costs and annual compliance. for one holiday rental villa is PMA overkill?",
  },
  {
    category: "buy",
    title: "red flags buying villa bali checklist",
    body: "first time buyer, notary recommended but want my own list before i fly out to sign anything.",
  },
  {
    category: "buy",
    title: "notary fees bali property purchase rough %",
    body: "budgeting for a leasehold around 2.5b idr. what should i set aside for notary and taxes?",
  },
  {
    category: "buy",
    title: "can i buy while still in europe need local rep?",
    body: "based in berlin, cant fly until december. can due diligence and signing happen with power of attorney?",
  },
  {
    category: "buy",
    title: "ROI rental villa ubud realistic numbers",
    body: "agent claims 12% net on a new build near ubud. sounds optimistic — what do owners actually see?",
  },
  {
    category: "buy",
    title: "off plan villa risk bali stories",
    body: "developer wants 40% before completion. any horror stories or is escrow common now?",
  },
  {
    category: "buy",
    title: "hak pakai explained like im 5 pls",
    body: "keep seeing hak pakai vs leasehold in ads and my head spins. which one do most expats end up with?",
  },
  {
    category: "buy",
    title: "tax selling bali property foreigner",
    body: "might sell leasehold in 5 years if we relocate. what taxes hit non-residents on exit?",
  },
  {
    category: "buy",
    title: "land near ubud good investment or oversaturated",
    body: "plot in tegalalang, cheap per are. too many villas going up or still room for rental demand?",
  },
  {
    category: "buy",
    title: "due diligence before deposit land purchase",
    body: "seller pushing 10% this week. what must be checked before any money leaves my account?",
  },
  {
    category: "services",
    title: "shortlist hunt service how many villas they show",
    body: "considering paid search for 3br under 25jt. do agencies usually send 5 options or drag it out?",
  },
  {
    category: "services",
    title: "relocation package ubud with kids whats included",
    body: "company might pay for relocation help. what do good packages actually cover for families?",
  },
  {
    category: "services",
    title: "someone view villa for me while im abroad reliable?",
    body: "stuck in singapore until visa sorted. is hiring a local viewer worth it vs trusting whatsapp video?",
  },
  {
    category: "services",
    title: "internet install new rental who arranges isp",
    body: "moving into unfurnished-ish villa next month. tenant or owner normally books indihome / first media?",
  },
  {
    category: "services",
    title: "cleaning villa while away monthly cost ballpark",
    body: "travel monthly for work, villa empty 10 days at a time. weekly clean while gone — rough cost?",
  },
  {
    category: "services",
    title: "buying due diligence what lawyers actually check",
    body: "paying for legal review on leasehold. want to know what documents they should pull beyond the title.",
  },
  {
    category: "living",
    title: "wise vs local bank receive rent payments indonesia",
    body: "landlord wants idr to mandiri. can i fund from wise without crazy fees every month?",
  },
  {
    category: "living",
    title: "SIM card best for 1 year stay telkomsel?",
    body: "need data for hotspot backup. tourist sim vs local plan — what do long stay people use?",
  },
  {
    category: "living",
    title: "international school ubud commute times",
    body: "green school vs canggu options. how brutal is the morning drive from penestanan realistically?",
  },
  {
    category: "living",
    title: "hospital near ubud expat friendly",
    body: "mild asthma, want to know nearest clinic that speaks english if things flare up.",
  },
  {
    category: "living",
    title: "rainy season worst months move to ubud",
    body: "flexible on arrival date. is jan/feb miserable for settling in or fine if villa is solid?",
  },
  {
    category: "living",
    title: "coworking ubud wifi reliable zoom calls",
    body: "villa wifi might be weak. which cowork spaces have stable upload for daily meetings?",
  },
  {
    category: "living",
    title: "driving license bali tourist vs long stay",
    body: "here on b211 extending, police stopped a friend. do i need proper sim or international enough?",
  },
  {
    category: "living",
    title: "gojek grab grocery ubud daily life",
    body: "no car planned. can you live in sayan area without constant scooter runs for basics?",
  },
  {
    category: "living",
    title: "is ubud safe at night solo female",
    body: "often home alone after dinner in town. any areas to avoid walking back late?",
  },
  {
    category: "living",
    title: "kitas through property company legit?",
    body: "developer offers kitas if we buy off plan. sounds sketchy — is that a normal package?",
  },
  {
    category: "living",
    title: "monthly budget couple ubud eat out often",
    body: "two adults, eat out most nights, weekend trips. excluding rent whats a sane monthly spend?",
  },
  {
    category: "living",
    title: "B211 extension runs how many times realistically",
    body: "planning 8-9 months total while house hunting. how many visa runs before they raise eyebrows?",
  },
  {
    category: "living",
    title: "open bank account bali as foreigner 2026",
    body: "need local account for rent transfers. kitas not yet — can b211 holders still open mandiri/bca?",
  },
  {
    category: "living",
    title: "best area ubud remote worker fiber internet",
    body: "upload speed matters more than rice views. which neighborhoods actually have fiber to the door?",
  },
];
