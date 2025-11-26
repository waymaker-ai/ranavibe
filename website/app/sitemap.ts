import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://rana.cx';

  const routes = [
    '',
    '/docs',
    '/docs/quick-start',
    '/docs/packages',
    '/docs/cli',
    '/docs/api',
    '/examples',
    '/pricing',
    '/training',
    '/training/fundamentals',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : route.startsWith('/docs') ? 0.8 : 0.6,
  }));
}
