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
 */
export const QA_QUESTION_BANK: Array<{
  title: string;
  category: "rent" | "buy" | "services" | "living";
  body?: string;
}> = [
  { category: "rent", title: "3 bedroom villa ubud quiet area budget?" },
  { category: "rent", title: "Is 18jt/month realistic for 2br with pool penestanan" },
  { category: "rent", title: "minimum lease villa bali usually how many months" },
  { category: "rent", title: "scooter parking at most ubud villas or need to ask" },
  { category: "rent", title: "lodtunduh vs tegalalang for long stay which better" },
  { category: "rent", title: "AC included in rent or extra bill typical?" },
  { category: "rent", title: "how to avoid scam listings facebook bali villas" },
  { category: "rent", title: "deposit 2 months normal? owner asking 6" },
  { category: "rent", title: "villa with rice field view ubud price range 2026" },
  { category: "rent", title: "guesthouse vs villa for 4 month stay solo" },
  { category: "rent", title: "can negotiate rent if paying 6 months upfront" },
  { category: "rent", title: "pool guy and gardener who pays tenant or owner" },
  { category: "rent", title: "off season discounts long term rental bali real?" },
  { category: "rent", title: "walking distance ubud center from sayan realistic daily" },
  { category: "rent", title: "mosquito situation ubud villas need nets?" },
  { category: "rent", title: "2 kids school nearby penestanan options" },
  { category: "rent", title: "co living ubud vs private villa worth it" },
  { category: "rent", title: "water filter needed ubud tap water villa" },
  { category: "rent", title: "power outages how often ubud area" },
  { category: "buy", title: "PT PMA villa ownership still worth hassle 2026" },
  { category: "buy", title: "red flags buying villa bali checklist" },
  { category: "buy", title: "notary fees bali property purchase rough %" },
  { category: "buy", title: "can i buy while still in europe need local rep?" },
  { category: "buy", title: "ROI rental villa ubud realistic numbers" },
  { category: "buy", title: "off plan villa risk bali stories" },
  { category: "buy", title: "hak pakai explained like im 5 pls" },
  { category: "buy", title: "tax selling bali property foreigner" },
  { category: "buy", title: "land near ubud good investment or oversaturated" },
  { category: "buy", title: "due diligence before deposit land purchase" },
  { category: "services", title: "shortlist hunt service how many villas they show" },
  { category: "services", title: "relocation package ubud with kids whats included" },
  { category: "services", title: "someone view villa for me while im abroad reliable?" },
  { category: "services", title: "internet install new rental who arranges isp" },
  { category: "services", title: "cleaning villa while away monthly cost ballpark" },
  { category: "services", title: "buying due diligence what lawyers actually check" },
  { category: "living", title: "wise vs local bank receive rent payments indonesia" },
  { category: "living", title: "SIM card best for 1 year stay telkomsel?" },
  { category: "living", title: "international school ubud commute times" },
  { category: "living", title: "hospital near ubud expat friendly" },
  { category: "living", title: "rainy season worst months move to ubud" },
  { category: "living", title: "coworking ubud wifi reliable zoom calls" },
  { category: "living", title: "driving license bali tourist vs long stay" },
  { category: "living", title: "gojek grab grocery ubud daily life" },
  { category: "living", title: "is ubud safe at night solo female" },
  { category: "living", title: "kitas through property company legit?" },
  { category: "living", title: "monthly budget couple ubud eat out often" },
  { category: "living", title: "B211 extension runs how many times realistically" },
  { category: "living", title: "open bank account bali as foreigner 2026" },
  { category: "living", title: "best area ubud remote worker fiber internet" },
];
