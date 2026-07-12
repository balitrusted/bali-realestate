import type { GuideMapPoi } from "@/types/article";

/**
 * Everyday anchors for the Mas area guide map.
 * North corridor pins overlap Lodtunduh daily life but sit inside official Desa Mas.
 */
export const masGuidePois: GuideMapPoi[] = [
  {
    id: "pepito",
    label: "Pepito Market Peliatan",
    lat: -8.5244443,
    lng: 115.2649605,
    note: "Nearest full supermarket for many north Mas pins",
    mapsUrl: "https://maps.app.goo.gl/yKiRF96KTarHxtvKA",
  },
  {
    id: "usha",
    label: "Usha Cafe and Bakery",
    lat: -8.5334402,
    lng: 115.2636931,
    note: "North corridor - A.A. Gede Rai crossroads (OSM)",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Usha+Cafe+and+Bakery+Ubud",
  },
  {
    id: "7am",
    label: "7AM Bakers",
    lat: -8.533621599136405,
    lng: 115.26312353605691,
    note: "Bakery on the main crossroads",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=7AM+Bakers+Ubud",
  },
  {
    id: "titi-batu",
    label: "Titi Batu Ubud Club",
    lat: -8.5364296,
    lng: 115.2666992,
    note: "Family club - north Mas / Lodtunduh corridor",
    mapsUrl: "https://maps.app.goo.gl/QUGChA3zEmdU1gqQ6",
  },
  {
    id: "pelangi",
    label: "Pelangi School (International)",
    lat: -8.5369,
    lng: 115.26707,
    note: "School anchor near Titi Batu (OSM)",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Pelangi+School+International+Ubud",
  },
  {
    id: "empathy",
    label: "Empathy School",
    lat: -8.5278,
    lng: 115.2685,
    note: "Peliatan border - family school run from north Mas",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Empathy+School+Ubud",
  },
  {
    id: "ambarawati",
    label: "Ambarawati crossroads",
    lat: -8.541246069732853,
    lng: 115.26211595724158,
    note: "Traffic hub on Jl. A.A. Gede Rai",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Jl.+Ambarawati+Jl.+A.A.+Gede+Rai+Ubud",
  },
  {
    id: "waldorf",
    label: "Waldorf Bali Madu",
    lat: -8.52792,
    lng: 115.25104,
    note: "Kindergarten / school toward Sayan (OSM)",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Waldorf+Bali+Madu+Ubud",
  },
  {
    id: "raya-mas",
    label: "Jl. Raya Mas craft village",
    lat: -8.54917,
    lng: 115.26194,
    note: "Wood carving galleries and workshops strip",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Mas+Village+Wood+Carving+Ubud",
  },
  {
    id: "bebek-tebasari",
    label: "Bebek Tebasari Resto",
    lat: -8.5456943,
    lng: 115.2568408,
    note: "Kengetan corridor restaurant (OSM)",
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
    id: "kengetan",
    label: "Jl. Raya Kengetan",
    lat: -8.5512,
    lng: 115.2555,
    note: "South-west exit toward deeper green lanes",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Jl.+Raya+Kengetan+Mas+Ubud",
  },
];
