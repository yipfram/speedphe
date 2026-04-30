export interface CityBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface CityConfig {
  slug: string;
  name: string;
  country: string;
  regionName: string;
  title: string;
  description: string;
  intro: string;
  center: {
    lat: number;
    lng: number;
  };
  bounds: CityBounds;
  keywords: string[];
}

export const CITIES: CityConfig[] = [
  {
    slug: 'hanoi',
    name: 'Hanoi',
    country: 'Vietnam',
    regionName: 'Hanoi',
    title: 'Best Cafes With Fast Wi-Fi for Work in Hanoi',
    description:
      'Compare the best measured cafe Wi-Fi in Hanoi. Find work-friendly cafes with strong download speeds, lower latency, and recent tests.',
    intro:
      'Explore tested cafes in Hanoi ranked by real Wi-Fi performance for remote work, focused sessions, and reliable video calls.',
    center: {
      lat: 21.0285,
      lng: 105.8542,
    },
    bounds: {
      north: 21.1105,
      south: 20.955,
      east: 105.945,
      west: 105.73,
    },
    keywords: ['best wifi cafe hanoi', 'fast wifi cafe hanoi', 'best cafes to work from in hanoi'],
  },
  {
    slug: 'ho-chi-minh-city',
    name: 'Ho Chi Minh City',
    country: 'Vietnam',
    regionName: 'Ho Chi Minh City',
    title: 'Best Cafes With Fast Wi-Fi for Work in Ho Chi Minh City',
    description:
      'Find the top tested cafe Wi-Fi in Ho Chi Minh City. Compare internet speeds, latency, and recent results before choosing where to work.',
    intro:
      'Discover cafes in Ho Chi Minh City ranked by measured Wi-Fi quality, so you can choose better spots for laptop work and online meetings.',
    center: {
      lat: 10.7769,
      lng: 106.7009,
    },
    bounds: {
      north: 10.89,
      south: 10.69,
      east: 106.83,
      west: 106.58,
    },
    keywords: [
      'best wifi cafe ho chi minh city',
      'fast wifi cafe district 1',
      'laptop friendly cafe saigon',
    ],
  },
];

export function getCityBySlug(slug: string) {
  return CITIES.find((city) => city.slug === slug) ?? null;
}

export function isWithinCityBounds(coordinates: { lat: number; lng: number }, bounds: CityBounds) {
  return (
    coordinates.lat <= bounds.north &&
    coordinates.lat >= bounds.south &&
    coordinates.lng <= bounds.east &&
    coordinates.lng >= bounds.west
  );
}
