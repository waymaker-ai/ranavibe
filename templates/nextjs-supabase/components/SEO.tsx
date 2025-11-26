import { Metadata } from 'next';

/**
 * SEO component props
 */
export interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string[];
}

/**
 * Generate metadata for a page
 * Use in page.tsx files with Next.js App Router
 *
 * @example
 * ```tsx
 * // app/page.tsx
 * import { generateMetadata } from '@/components/SEO';
 *
 * export const metadata = generateMetadata({
 *   title: 'Home',
 *   description: 'Welcome to our app',
 *   image: '/og-image.png',
 * });
 * ```
 */
export function generateMetadata(props: SEOProps): Metadata {
  const {
    title,
    description,
    image,
    url,
    type = 'website',
    publishedTime,
    modifiedTime,
    author,
    keywords,
  } = props;

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'RANA App';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const fullTitle = `${title} | ${siteName}`;
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const ogImage = image ? `${siteUrl}${image}` : `${siteUrl}/og-image.png`;

  return {
    title: fullTitle,
    description,
    keywords: keywords?.join(', '),
    authors: author ? [{ name: author }] : undefined,
    openGraph: {
      type,
      url: fullUrl,
      title: fullTitle,
      description,
      siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: fullUrl,
    },
  };
}

/**
 * Structured data (JSON-LD) component
 * Add to page layouts for rich search results
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * <StructuredData type="organization" data={{
 *   name: "My Company",
 *   url: "https://example.com",
 *   logo: "https://example.com/logo.png",
 * }} />
 * ```
 */
export function StructuredData({
  type,
  data,
}: {
  type: 'organization' | 'website' | 'article' | 'product';
  data: Record<string, any>;
}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type === 'organization' ? 'Organization' : type,
    ...data,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
