import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://mapmyauto.com';
  
  // Main pages
  const staticPages = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/route-finder`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contributor`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
  ];

  // Dynamic routes for common search queries and locations
  const dynamicRoutes = [
    '/route-finder?from=dumdum&to=airport',
    '/route-finder?from=howrah&to=airport',
    '/route-finder?from=sealdah&to=newtown',
    '/route-finder?from=saltlake&to=airport',
    '/route-finder?from=dakshineswar&to=airport',
    '/route-finder?from=newtown&to=airport',
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...dynamicRoutes];
}
