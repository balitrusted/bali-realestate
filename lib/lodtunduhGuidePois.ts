import type { GuideMapPoi } from "@/types/article";

/**
 * Everyday anchors for the Lodtunduh area guide map.
 * Prefer Google Place pin coords (!3d/!4d in Maps URLs) or OSM where available.
 */
export const lodtunduhGuidePois: GuideMapPoi[] = [
  {
    id: "titi-batu",
    label: "Titi Batu Ubud Club",
    lat: -8.5364296,
    lng: 115.2666992,
    note: "Pool, gym, kids - main search anchor",
    mapsUrl: "https://maps.app.goo.gl/QUGChA3zEmdU1gqQ6",
  },
  {
    id: "waybu",
    label: "Waybu Coffee & Eatery",
    lat: -8.537572558348037,
    lng: 115.26708724723507,
    note: "Titi Batu corridor - walkable lane",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Waybu+Coffee+Eatery+Ubud",
  },
  {
    id: "pelangi",
    label: "Pelangi School (International)",
    lat: -8.5369,
    lng: 115.26707,
    note: "Family draw - across from Titi Batu (OSM)",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Pelangi+School+International+Ubud",
  },
  {
    id: "usha",
    label: "Usha Cafe and Bakery",
    lat: -8.5334402,
    lng: 115.2636931,
    note: "Crossroads cluster - local favorite (OSM)",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Usha+Cafe+and+Bakery+Ubud",
  },
  {
    id: "7am",
    label: "7AM Bakers",
    lat: -8.533621599136405,
    lng: 115.26312353605691,
    note: "Chain bakery on the A.A. Gede Rai crossroads",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=7AM+Bakers+Ubud",
  },
  {
    id: "fitness",
    label: "Ubud Fitness / CrossFit Ubud",
    lat: -8.533456070111251,
    lng: 115.26282907226441,
    note: "Fitness valley below the crossroads",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=CrossFit+Ubud",
  },
  {
    id: "ambarawati",
    label: "Ambarawati crossroads",
    lat: -8.541246069732853,
    lng: 115.26211595724158,
    note: "Main traffic hub on Jl. A.A. Gede Rai",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Jl.+Ambarawati+Jl.+A.A.+Gede+Rai+Ubud",
  },
  {
    id: "bu-ayu",
    label: "Bu Ayu's fruit shop",
    lat: -8.54128232199924,
    lng: 115.26188152990589,
    note: "Affordable fruit on A.A. Gede Rai",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Bu+Ayu+fruit+shop+Lodtunduh+Ubud",
  },
  {
    id: "bebek-tebasari",
    label: "Bebek Tebasari Resto",
    lat: -8.5456943,
    lng: 115.2568408,
    note: "Older restaurant on Jl. Raya Kengetan (OSM)",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Bebek+Tebasari+Resto+Ubud",
  },
  {
    id: "westin",
    label: "The Westin Resort & Spa Ubud",
    lat: -8.5469004,
    lng: 115.2523462,
    note: "South green belt - rice and old trees (OSM)",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=The+Westin+Resort+Spa+Ubud",
  },
  {
    id: "pepito",
    label: "Pepito Market Peliatan",
    lat: -8.5244443,
    lng: 115.2649605,
    note: "Nearest big supermarket (Peliatan, errands)",
    mapsUrl: "https://maps.app.goo.gl/yKiRF96KTarHxtvKA",
  },
];
