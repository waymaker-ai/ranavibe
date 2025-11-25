import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from '@/components/theme-provider';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { PWAInstall } from '@/components/pwa-install';
import { PWAInitializer } from '@/components/pwa-initializer';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'RANA Framework - React Agent Next Architecture',
    template: '%s | RANA Framework',
  },
  description: 'Professional AI agent framework for React applications. Build production-ready AI agents with type safety, security, and scalability.',
  keywords: ['AI', 'React', 'Framework', 'Agents', 'LLM', 'TypeScript', 'Next.js'],
  authors: [{ name: 'Waymaker AI' }],
  creator: 'Waymaker AI',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://rana.cx',
    title: 'RANA Framework',
    description: 'Professional AI agent framework for React applications',
    siteName: 'RANA Framework',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RANA Framework',
    description: 'Professional AI agent framework for React applications',
    creator: '@waymakerAI',
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
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen flex flex-col antialiased">
        <PWAInitializer />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navigation />
          <main className="flex-1">{children}</main>
          <Footer />
          <PWAInstall />
        </ThemeProvider>
      </body>
    </html>
  );
}
