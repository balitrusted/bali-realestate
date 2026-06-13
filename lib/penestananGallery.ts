import type { ArticleGalleryItem } from "@/types/article";

const base = "/penestanan-photos";

function photo(
  file: string,
  alt: string,
  caption?: string
): ArticleGalleryItem {
  return { src: `${base}/${file}`, alt, caption };
}

/** Top carousel — author picks 01–13 (most atmospheric). */
export const penestananGalleryIntro: ArticleGalleryItem[] = [
  photo(
    "traffic-jam-near-zest-cafe-01.jpg",
    "Traffic near Zest Cafe, Penestanan, Ubud",
    "The central strip can feel busy at peak hours — micro-location matters."
  ),
  photo(
    "woman-with-a-dog-walking-02.jpg",
    "Woman walking a dog on a Penestanan lane, Ubud",
    "Village lanes stay lived-in, not just tourist-facing."
  ),
  photo(
    "lecture-in-moksa-ubud-shale-03.jpg",
    "Lecture at Moksa Ubud, Penestanan",
    "Wellness and talks are part of the local rhythm."
  ),
  photo(
    "ecstatic-dance-promo-flyer-by-alchemy-04.jpg",
    "Ecstatic dance event at Alchemy, Penestanan",
    "Alchemy anchors more than food — events and community too."
  ),
  photo(
    "esctatic-dance-event-at-alchemy-yofa-center-penestanan-05.jpg",
    "Ecstatic dance at Alchemy yoga center, Penestanan",
    "The hill has a strong yoga and movement scene."
  ),
  photo(
    "beautiful-climbing-greenery-on-the-wall-06.jpg",
    "Climbing greenery on a Penestanan wall, Ubud",
    "Green detail on villa lanes and compound walls."
  ),
  photo(
    "living-area-beside-alchemy-cafe-07.jpg",
    "Living area beside Alchemy Cafe, Penestanan",
    "Café-adjacent life on Jl. Raya Penestanan."
  ),
  photo(
    "one-of-the-key-green-areas-in-penestantan-near-moksa-ubud-cafe-08.jpg",
    "Green pocket near Moksa Ubud, Penestanan",
    "Quiet green corners between cafés and villas."
  ),
  photo(
    "neatly-parked-scooters-in-penestanan-09.jpg",
    "Scooters parked on a Penestanan lane, Ubud",
    "Scooters still shape daily logistics, even in walkable pockets."
  ),
  photo(
    "self-made-salad-in-alchemy-cafe-10.jpg",
    "Salad at Alchemy Cafe, Penestanan",
    "Raw and health-food culture is a real daily anchor here."
  ),
  photo(
    "view-from-a-hill-inside-zest-cafe-11.jpg",
    "Hill view from Zest Cafe, Penestanan",
    "Café outlooks are part of why people choose the hill."
  ),
  photo(
    "jl-penestanan-kelod-view-12.jpg",
    "Jl. Penestanan Kelod outlook, Ubud",
    "Kelod opens toward rice fields and greener south/east views."
  ),
  photo(
    "typical-penestanan-accomodation-13.jpg",
    "Typical accommodation in Penestanan, Ubud",
    "Guesthouse and villa stock mix on the lanes."
  ),
];

/** Second carousel before quick reference — remaining area photos. */
export const penestananGalleryEnd: ArticleGalleryItem[] = [
  photo(
    "typical-villa-with-a-pool-in-penestanan.jpg",
    "Typical pool villa in Penestanan, Ubud",
    "Private pool villas are common rental stock on the hill."
  ),
  photo(
    "excellent-vegan-sushi-at-healthy-ubud-cafe.jpg",
    "Vegan sushi at Healthy Ubud Cafe, Penestanan",
    "Healthy Ubud sits in the Vespa corridor many renters use as a pin."
  ),
  photo(
    "plant-bistro-penestanan.jpg",
    "Plant Bistro, Penestanan, Ubud",
    "Plant-based cafés cluster on and around the main hill lanes."
  ),
  photo(
    "vegan-sushi-roll-in-plant-bistro-italian-cafe.jpg",
    "Vegan sushi at Plant Bistro, Penestanan",
    "Italian-leaning plant café food on the hill."
  ),
  photo(
    "famous-shauberger-coffe-point.jpg",
    "Schauberger coffee point, Penestanan, Ubud",
    "Small coffee stops dot the creative corridor."
  ),
  photo(
    "view-from-the-roof-of-a-zest-cafe-penestanan.jpg",
    "Roof view at Zest Cafe, Penestanan",
    "Roof-level outlook over the village and hills."
  ),
  photo(
    "shop-inside-alchemy-cafe.jpg",
    "Shop inside Alchemy Cafe, Penestanan",
    "Alchemy doubles as a lifestyle stop, not just a meal."
  ),
  photo(
    "page-from-an-alchemy-cafe-menu.jpg",
    "Alchemy Cafe menu, Penestanan",
    "Menus here signal the health-food baseline many long-stayers expect."
  ),
  photo(
    "page-from-a-zest-cafe-menu.jpg",
    "Zest Cafe menu, Penestanan",
    "Zest is another familiar hill café anchor."
  ),
  photo(
    "mama-food-cafe-entrance-at-night.jpg",
    "Mama Food Cafe entrance at night, Penestanan",
    "Evening café life without central-Ubud chaos."
  ),
  photo(
    "club-sehat-bali.jpg",
    "Club Sehat Bali, Penestanan area",
    "Fitness and wellness spots sit close to everyday errands."
  ),
  photo(
    "ac-cargo-on-the-streets-of-penestanan.jpg",
    "AC cargo on Penestanan streets, Ubud",
    "Delivery and villa logistics on narrow lanes."
  ),
  photo(
    "alva-cervo-on-the-streets-of-penestanan.jpg",
    "Alva Cervo on Penestanan streets, Ubud",
    "Creative village character on the lanes."
  ),
];
