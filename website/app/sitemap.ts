import journal from '@/content/engineering-journal.json';
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://cofounder.cx';

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
    '/blog',
    ...journal.map(post => '/blog/' + post.slug),
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : route.startsWith('/docs') ? 0.8 : 0.6,
  }));
}

