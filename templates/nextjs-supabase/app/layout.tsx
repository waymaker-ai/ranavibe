import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { StructuredData } from '@/components/SEO';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

/**
 * Root metadata
 * This is the default metadata for all pages
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'),
  title: {
    default: process.env.NEXT_PUBLIC_SITE_NAME || 'RANA App',
    template: `%s | ${process.env.NEXT_PUBLIC_SITE_NAME || 'RANA App'}`,
  },
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Built with RANA Framework',
  keywords: ['nextjs', 'supabase', 'aads', 'ai', 'app'],
  authors: [{ name: 'Your Name' }],
  creator: 'Your Name',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: process.env.NEXT_PUBLIC_SITE_NAME,
    title: process.env.NEXT_PUBLIC_SITE_NAME,
    description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: process.env.NEXT_PUBLIC_SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: process.env.NEXT_PUBLIC_SITE_NAME,
    description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION,
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

/**
 * Root layout component
 * Wraps all pages in the application
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'RANA App';

  return (
    <html lang="en">
      <head>
        {/* Structured Data */}
        <StructuredData
          type="organization"
          data={{
            name: siteName,
            url: siteUrl,
            logo: `${siteUrl}/logo.png`,
            sameAs: [
              // Add your social media URLs here
              // 'https://twitter.com/yourusername',
              // 'https://github.com/yourusername',
            ],
          }}
        />
        <StructuredData
          type="website"
          data={{
            name: siteName,
            url: siteUrl,
            description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION,
          }}
        />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
