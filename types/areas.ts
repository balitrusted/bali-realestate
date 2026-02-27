// Main areas (regions) for SEO and navigation
export type MainArea = 'ubud' | 'canggu' | 'sanur' | 'seminyak' | 'tanah_lot';

// Sub-areas (neighborhoods) within main areas
export type SubArea =
  | 'gentong'
  | 'kedewatan'
  | 'keliki'
  | 'kemenuh'
  | 'lodtunduh'
  | 'penestanan'
  | 'petulu'
  | 'sayan'
  | 'sukawati'
  | 'tegallalang';

export interface AreaInfo {
  id: MainArea;
  name: string;
  nameEn: string;
  description: string;
  image?: string; // URL to area image
  subAreas?: SubArea[]; // Sub-areas within this main area
  seoTitle?: string;
  seoDescription?: string;
}

export const areas: Record<MainArea, AreaInfo> = {
  ubud: {
    id: 'ubud',
    name: 'Ubud',
    nameEn: 'Ubud',
    description: 'Ubud is the cultural heart of Bali, known for its lush rice terraces, yoga studios, and peaceful atmosphere. Perfect for long-term living, remote work, and families seeking a quiet lifestyle.',
    subAreas: ['gentong', 'kedewatan', 'keliki', 'kemenuh', 'lodtunduh', 'penestanan', 'petulu', 'sayan', 'sukawati', 'tegallalang'],
    seoTitle: 'Ubud and Surroundings - Long-term Villa Rentals and Sales',
    seoDescription: 'Find villas for rent and sale in Ubud and surrounding areas. Quiet neighborhoods, family-friendly options, and properties perfect for long-term living.',
  },
  canggu: {
    id: 'canggu',
    name: 'Canggu',
    nameEn: 'Canggu',
    description: 'Canggu is a vibrant coastal area popular with digital nomads and expats. Known for its beach clubs, cafes, and modern villas.',
    seoTitle: 'Canggu - Villa Rentals and Sales',
    seoDescription: 'Browse villas for rent and sale in Canggu. Beachside properties, modern amenities, and a vibrant expat community.',
  },
  sanur: {
    id: 'sanur',
    name: 'Sanur',
    nameEn: 'Sanur',
    description: 'Sanur offers a calmer beachside experience with a long beachfront, family-friendly atmosphere, and good infrastructure.',
    seoTitle: 'Sanur - Villa Rentals and Sales',
    seoDescription: 'Discover villas for rent and sale in Sanur. Family-friendly beachside properties with good infrastructure and calm atmosphere.',
  },
  seminyak: {
    id: 'seminyak',
    name: 'Seminyak',
    nameEn: 'Seminyak',
    description: 'Seminyak is a vibrant area known for beach clubs, restaurants, and upscale villas. Popular with expats and long-term visitors.',
    seoTitle: 'Seminyak - Villa Rentals and Sales',
    seoDescription: 'Find villas for rent and sale in Seminyak. Beachside and central options with modern amenities.',
  },
  tanah_lot: {
    id: 'tanah_lot',
    name: 'Tanah Lot',
    nameEn: 'Tanah Lot',
    description: 'Area near the iconic Tanah Lot temple. Quieter coastal setting with ocean views and nature.',
    seoTitle: 'Tanah Lot - Villa Rentals and Sales',
    seoDescription: 'Browse villas for rent and sale near Tanah Lot. Coastal and countryside properties.',
  },
};

export const subAreaNames: Record<SubArea, string> = {
  gentong: 'Gentong',
  kedewatan: 'Kedewatan',
  keliki: 'Keliki',
  kemenuh: 'Kemenuh',
  lodtunduh: 'Lodtunduh',
  penestanan: 'Penestanan',
  petulu: 'Petulu',
  sayan: 'Sayan',
  sukawati: 'Sukawati',
  tegallalang: 'Tegallalang',
};

/** Sub-areas belong only to Ubud. Other main areas (Canggu, Sanur, Seminyak, Tanah Lot) have no sub-areas. */
const UBUD_SUB_AREAS: SubArea[] = [
  'gentong', 'kedewatan', 'keliki', 'kemenuh', 'lodtunduh',
  'penestanan', 'petulu', 'sayan', 'sukawati', 'tegallalang',
];

/** Get main area that this sub-area belongs to. All current sub-areas are Ubud only. */
export function getMainAreaFromSubArea(subArea: SubArea): MainArea {
  return 'ubud';
}

/** Whether this sub-area is valid for the given main area. Only Ubud has sub-areas. */
export function isSubAreaOfMainArea(mainArea: MainArea, subArea: SubArea): boolean {
  return mainArea === 'ubud' && UBUD_SUB_AREAS.includes(subArea);
}

/** Label when sub-area is not set (e.g. for Seminyak, Canggu). Standard English for listings. */
export const SUBAREA_UNSPECIFIED_LABEL = 'Unspecified';
