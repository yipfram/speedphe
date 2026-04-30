import type { MetadataRoute } from 'next';
import { CITIES } from '@/lib/cities';
import { getPublicUrl } from '@/lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getPublicUrl();
  const cityUrls = CITIES.map((city) => ({
    url: `${baseUrl}/cities/${city.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...cityUrls,
  ];
}
