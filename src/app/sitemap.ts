import type { MetadataRoute } from 'next';
import { CITIES } from '@/lib/cities';

const BASE_URL = 'https://speedphe.rrchs.fr';

export default function sitemap(): MetadataRoute.Sitemap {
  const cityUrls = CITIES.map((city) => ({
    url: `${BASE_URL}/cities/${city.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...cityUrls,
  ];
}
