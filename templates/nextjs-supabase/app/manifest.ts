import { MetadataRoute } from 'next';

/**
 * Generate PWA manifest
 * Automatically served at /manifest.json
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
 */
export default function manifest(): MetadataRoute.Manifest {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'RANA App';

  return {
    name: siteName,
    short_name: siteName,
    description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Built with RANA Framework',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
