// Shared disease list, kiosk locations, and hospital locations for SynapseHK

export type HospitalLocation = {
  name: string;
  lat: number;
  lng: number;
  region: "HK" | "SZ" | "MAC" | "GBA";
};

export const HOSPITAL_LOCATIONS: HospitalLocation[] = [
  // Hong Kong — Major Public
  { name: "Queen Mary Hospital (HK)", lat: 22.2701, lng: 114.1307, region: "HK" },
  { name: "Prince of Wales Hospital (HK)", lat: 22.3807, lng: 114.2006, region: "HK" },
  { name: "Pamela Youde Nethersole Eastern Hospital (HK)", lat: 22.2839, lng: 114.2359, region: "HK" },
  { name: "United Christian Hospital (HK)", lat: 22.3228, lng: 114.2298, region: "HK" },
  { name: "Tuen Mun Hospital (HK)", lat: 22.4030, lng: 113.9764, region: "HK" },
  { name: "Princess Margaret Hospital (HK)", lat: 22.3405, lng: 114.1339, region: "HK" },
  { name: "Kwong Wah Hospital (HK)", lat: 22.3171, lng: 114.1699, region: "HK" },
  { name: "Queen Elizabeth Hospital (HK)", lat: 22.3099, lng: 114.1748, region: "HK" },
  { name: "Caritas Medical Centre (HK)", lat: 22.3417, lng: 114.1512, region: "HK" },
  { name: "North District Hospital (HK)", lat: 22.4974, lng: 114.1285, region: "HK" },
  { name: "Yan Chai Hospital (HK)", lat: 22.3643, lng: 114.1128, region: "HK" },
  { name: "Alice Ho Miu Ling Nethersole Hospital (HK)", lat: 22.4486, lng: 114.1661, region: "HK" },
  { name: "Pok Oi Hospital (HK)", lat: 22.4428, lng: 114.0403, region: "HK" },
  { name: "Ruttonjee Hospital (HK)", lat: 22.2762, lng: 114.1726, region: "HK" },
  // Hong Kong — Private
  { name: "Hong Kong Sanatorium & Hospital (HK)", lat: 22.2756, lng: 114.1834, region: "HK" },
  { name: "Matilda International Hospital (HK)", lat: 22.2670, lng: 114.1467, region: "HK" },
  { name: "St. Paul's Hospital (HK)", lat: 22.2867, lng: 114.1844, region: "HK" },
  { name: "Gleneagles Hospital Hong Kong (HK)", lat: 22.2488, lng: 114.1675, region: "HK" },
  { name: "Canossa Hospital (HK)", lat: 22.2801, lng: 114.1505, region: "HK" },
  // Shenzhen
  { name: "Shenzhen People's Hospital (SZ)", lat: 22.5563, lng: 114.0945, region: "SZ" },
  { name: "Shenzhen University General Hospital (SZ)", lat: 22.5305, lng: 113.9507, region: "SZ" },
  { name: "Peking University Shenzhen Hospital (SZ)", lat: 22.5392, lng: 114.0501, region: "SZ" },
  { name: "Southern University of Science Hospital (SZ)", lat: 22.5086, lng: 113.9858, region: "SZ" },
  { name: "Shenzhen Children's Hospital (SZ)", lat: 22.5689, lng: 114.0613, region: "SZ" },
  { name: "Shenzhen Second People's Hospital (SZ)", lat: 22.5452, lng: 114.0603, region: "SZ" },
  { name: "HK-Shenzhen Hospital (GBA)", lat: 22.5104, lng: 114.0601, region: "GBA" },
  // Macau
  { name: "Kiang Wu Hospital (MAC)", lat: 22.2032, lng: 113.5457, region: "MAC" },
  { name: "Centro Hospitalar Conde de São Januário (MAC)", lat: 22.2045, lng: 113.5481, region: "MAC" },
  { name: "Hospital Universitário de Macau (MAC)", lat: 22.1667, lng: 113.5600, region: "MAC" },
  { name: "The Macau Jockey Club Sports Medicine Centre (MAC)", lat: 22.1558, lng: 113.5584, region: "MAC" },
];

/** Haversine distance in km between two lat/lng points */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type AxonDispensaryLocation = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  region: "HK" | "SZ" | "MAC" | "GBA";
};

export const AXON_DISPENSARY_LOCATIONS: AxonDispensaryLocation[] = [
  // Hong Kong Island
  { id: "disp-central",       name: "Central Station Axon Dispensary",       lat: 22.2822, lng: 114.1584, region: "HK" },
  { id: "disp-admiralty",     name: "Admiralty Pacific Place Axon Dispensary", lat: 22.2794, lng: 114.1662, region: "HK" },
  { id: "disp-wanchai",       name: "Wan Chai Market Axon Dispensary",       lat: 22.2769, lng: 114.1731, region: "HK" },
  { id: "disp-causeway-bay",  name: "Causeway Bay Times Square Axon Dispensary", lat: 22.2796, lng: 114.1824, region: "HK" },
  { id: "disp-north-point",   name: "North Point Cityplaza Axon Dispensary", lat: 22.2909, lng: 114.2003, region: "HK" },
  { id: "disp-kennedy-town",  name: "Kennedy Town Praya Axon Dispensary",    lat: 22.2815, lng: 114.1288, region: "HK" },
  { id: "disp-aberdeen",      name: "Aberdeen Promenade Axon Dispensary",    lat: 22.2497, lng: 114.1545, region: "HK" },
  { id: "disp-stanley",       name: "Stanley Plaza Axon Dispensary",         lat: 22.2181, lng: 114.2136, region: "HK" },
  { id: "disp-taikoo",        name: "Taikoo Shing Axon Dispensary",          lat: 22.2872, lng: 114.2170, region: "HK" },
  { id: "disp-shek-o",        name: "Chai Wan MTR Axon Dispensary",          lat: 22.2645, lng: 114.2372, region: "HK" },
  // Kowloon
  { id: "disp-tsimshatsui",   name: "Tsim Sha Tsui Harbour City Axon Dispensary", lat: 22.2991, lng: 114.1718, region: "HK" },
  { id: "disp-mongkok",       name: "Mong Kok Argyle Street Axon Dispensary", lat: 22.3195, lng: 114.1697, region: "HK" },
  { id: "disp-wongkokkok",    name: "Kowloon City Market Axon Dispensary",   lat: 22.3285, lng: 114.1890, region: "HK" },
  { id: "disp-kowloon-bay",   name: "Kowloon Bay MegaBox Axon Dispensary",   lat: 22.3228, lng: 114.2138, region: "HK" },
  { id: "disp-diamond-hill",  name: "Diamond Hill Festival Walk Axon Dispensary", lat: 22.3396, lng: 114.2008, region: "HK" },
  { id: "disp-tokyuan",       name: "To Kwa Wan Axon Dispensary",            lat: 22.3154, lng: 114.1903, region: "HK" },
  // New Territories
  { id: "disp-shatin",        name: "Sha Tin New Town Plaza Axon Dispensary", lat: 22.3872, lng: 114.1876, region: "HK" },
  { id: "disp-tuen-mun",      name: "Tuen Mun Town Plaza Axon Dispensary",   lat: 22.3959, lng: 113.9771, region: "HK" },
  { id: "disp-yuen-long",     name: "Yuen Long YOHO Mall Axon Dispensary",   lat: 22.4443, lng: 114.0218, region: "HK" },
  { id: "disp-tai-po",        name: "Tai Po Mega Mall Axon Dispensary",      lat: 22.4490, lng: 114.1643, region: "HK" },
  { id: "disp-fanling",       name: "Fanling Centre Axon Dispensary",        lat: 22.4921, lng: 114.1384, region: "HK" },
  { id: "disp-tko",           name: "Tseung Kwan O PopCorn Axon Dispensary", lat: 22.3072, lng: 114.2590, region: "HK" },
  { id: "disp-tsuen-wan",     name: "Tsuen Wan CityWalk Axon Dispensary",    lat: 22.3722, lng: 114.1146, region: "HK" },
  // Shenzhen
  { id: "disp-sz-futian",     name: "Futian COCO Park Axon Dispensary",      lat: 22.5435, lng: 114.0574, region: "SZ" },
  { id: "disp-sz-luohu",      name: "Luohu MixC Axon Dispensary",            lat: 22.5476, lng: 114.1172, region: "SZ" },
  { id: "disp-sz-nanshan",    name: "Nanshan Sea World Axon Dispensary",     lat: 22.4883, lng: 113.9175, region: "SZ" },
  { id: "disp-sz-longhua",    name: "Longhua MixC Axon Dispensary",          lat: 22.6405, lng: 114.0369, region: "SZ" },
  { id: "disp-sz-baoan",      name: "Bao'an Airport Axon Dispensary",        lat: 22.5631, lng: 113.8838, region: "SZ" },
  // Macau
  { id: "disp-mac-peninsula", name: "Macau Ferry Terminal Axon Dispensary",  lat: 22.2010, lng: 113.5440, region: "MAC" },
  { id: "disp-mac-cotai",     name: "Cotai Venetian Axon Dispensary",        lat: 22.1468, lng: 113.5597, region: "MAC" },
];

/** Return hospitals sorted by distance from a kiosk, closest first */
export function hospitalsByDistance(kioskLat: number, kioskLng: number): Array<HospitalLocation & { distKm: number }> {
  return HOSPITAL_LOCATIONS
    .map((h) => ({ ...h, distKm: haversineKm(kioskLat, kioskLng, h.lat, h.lng) }))
    .sort((a, b) => a.distKm - b.distKm);
}

// Shared disease list and kiosk locations for SynapseHK

export const DISEASE_LIST = [
  "Influenza (Flu)",
  "COVID-19",
  "Respiratory Syncytial Virus (RSV)",
  "Pneumonia",
  "Tuberculosis (TB)",
  "Dengue Fever",
  "Hand, Foot & Mouth Disease (HFMD)",
  "Norovirus Gastroenteritis",
  "Streptococcal Pharyngitis",
  "Urinary Tract Infection (UTI)",
  "Acute Bronchitis",
  "Sinusitis",
  "Otitis Media (Ear Infection)",
  "Conjunctivitis (Pink Eye)",
  "Gastroenteritis",
  "Hypertensive Crisis",
  "Acute Asthma Exacerbation",
  "Allergic Rhinitis",
  "Migraine",
  "Anxiety Disorder",
  "Cellulitis",
  "Viral Upper Respiratory Tract Infection",
  "Mumps",
  "Chickenpox (Varicella)",
  "Measles",
  "Hepatitis A",
  "Hepatitis B",
  "Leptospirosis",
  "Legionnaires' Disease",
  "Typhoid Fever",
];

export type KioskLocation = {
  id: string;
  name: string;
  district: string;
  region: "HK" | "SZ" | "GBA" | "MAC";
  lat: number;
  lng: number;
};

export const KIOSK_LOCATIONS: KioskLocation[] = [
  // Hong Kong Island
  { id: "hk-central", name: "Central MTR Station Kiosk", district: "Central", region: "HK", lat: 22.2823, lng: 114.1577 },
  { id: "hk-admiralty", name: "Admiralty Station Kiosk", district: "Admiralty", region: "HK", lat: 22.2792, lng: 114.1651 },
  { id: "hk-causeway-bay", name: "Causeway Bay Kiosk", district: "Causeway Bay", region: "HK", lat: 22.2800, lng: 114.1829 },
  { id: "hk-wanchai", name: "Wan Chai Clinic Kiosk", district: "Wan Chai", region: "HK", lat: 22.2763, lng: 114.1718 },
  { id: "hk-kennedy-town", name: "Kennedy Town Community Kiosk", district: "Kennedy Town", region: "HK", lat: 22.2812, lng: 114.1282 },
  { id: "hk-aberdeen", name: "Aberdeen Centre Kiosk", district: "Aberdeen", region: "HK", lat: 22.2500, lng: 114.1536 },
  { id: "hk-taikoo", name: "Taikoo Place Kiosk", district: "Quarry Bay", region: "HK", lat: 22.2877, lng: 114.2163 },
  // Kowloon
  { id: "hk-mongkok", name: "Mong Kok Station Kiosk", district: "Mong Kok", region: "HK", lat: 22.3193, lng: 114.1694 },
  { id: "hk-tsimshatsui", name: "Tsim Sha Tsui Kiosk", district: "Tsim Sha Tsui", region: "HK", lat: 22.2988, lng: 114.1722 },
  { id: "hk-wongkokkok", name: "Wong Kok Station Kiosk", district: "Kowloon City", region: "HK", lat: 22.3289, lng: 114.1892 },
  { id: "hk-klt-bay", name: "Kowloon Bay Metro Kiosk", district: "Kowloon Bay", region: "HK", lat: 22.3232, lng: 114.2133 },
  { id: "hk-diamond-hill", name: "Diamond Hill Station Kiosk", district: "Diamond Hill", region: "HK", lat: 22.3401, lng: 114.2012 },
  // New Territories
  { id: "hk-shatin", name: "Shatin New Town Kiosk", district: "Sha Tin", region: "HK", lat: 22.3875, lng: 114.1874 },
  { id: "hk-tuen-mun", name: "Tuen Mun Hospital Kiosk", district: "Tuen Mun", region: "HK", lat: 22.3965, lng: 113.9766 },
  { id: "hk-yuen-long", name: "Yuen Long Plaza Kiosk", district: "Yuen Long", region: "HK", lat: 22.4445, lng: 114.0221 },
  { id: "hk-tai-po", name: "Tai Po Market Kiosk", district: "Tai Po", region: "HK", lat: 22.4493, lng: 114.1640 },
  { id: "hk-north-district", name: "Fanling Station Kiosk", district: "North", region: "HK", lat: 22.4917, lng: 114.1388 },
  { id: "hk-tseung-kwan-o", name: "Tseung Kwan O Kiosk", district: "Sai Kung", region: "HK", lat: 22.3074, lng: 114.2593 },
  // Shenzhen
  { id: "sz-futian", name: "Futian CBD Kiosk", district: "Futian", region: "SZ", lat: 22.5428, lng: 114.0579 },
  { id: "sz-luohu", name: "Luohu Port Kiosk", district: "Luohu", region: "SZ", lat: 22.5481, lng: 114.1168 },
  { id: "sz-nanshan", name: "Nanshan Tech Park Kiosk", district: "Nanshan", region: "SZ", lat: 22.5350, lng: 113.9296 },
  { id: "sz-longhua", name: "Longhua Station Kiosk", district: "Longhua", region: "SZ", lat: 22.6410, lng: 114.0373 },
  { id: "sz-bao-an", name: "Bao'an International Kiosk", district: "Bao'an", region: "SZ", lat: 22.5633, lng: 113.8833 },
  // Macau
  { id: "mac-peninsula", name: "Macau Peninsula Kiosk", district: "Santo António", region: "MAC", lat: 22.2006, lng: 113.5446 },
  { id: "mac-taipa", name: "Taipa Village Kiosk", district: "Taipa", region: "MAC", lat: 22.1612, lng: 113.5617 },
  { id: "mac-cotai", name: "Cotai Strip Kiosk", district: "Cotai", region: "MAC", lat: 22.1472, lng: 113.5600 },
];

export function getRandomDiagnosis(): string {
  return DISEASE_LIST[Math.floor(Math.random() * DISEASE_LIST.length)];
}

export function getRandomKioskLocation(): KioskLocation {
  return KIOSK_LOCATIONS[Math.floor(Math.random() * KIOSK_LOCATIONS.length)];
}
