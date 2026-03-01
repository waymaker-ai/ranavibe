import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from '@/components/theme-provider';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { PWAInstall } from '@/components/pwa-install';
import { PWAInitializer } from '@/components/pwa-initializer';
import { Analytics } from '@/components/analytics';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'RANA - Build Production AI Apps in Minutes',
    template: '%s | RANA Framework',
  },
  description: 'Production-ready AI development framework with 70% cost reduction. Includes @rana/helpers, @rana/prompts, @rana/rag packages. 9 LLM providers, enterprise security, and 25+ CLI commands.',
  keywords: ['AI', 'LLM', 'RAG', 'OpenAI', 'Anthropic', 'Claude', 'GPT', 'React', 'TypeScript', 'Cost Optimization', 'Prompt Management', 'Enterprise AI', 'Waymaker'],
  authors: [{ name: 'Waymaker AI' }],
  creator: 'Waymaker AI',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://rana.cx',
    title: 'RANA - Build Production AI Apps in Minutes',
    description: 'Production-ready AI development framework with 70% cost reduction. 9 LLM providers, enterprise security, and React hooks included.',
    siteName: 'RANA Framework',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RANA - Build Production AI Apps in Minutes',
    description: 'Production-ready AI framework with 70% cost reduction. @rana/helpers, @rana/prompts, @rana/rag packages for AI development.',
    creator: '@waylokai',
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
        <Analytics />
      </body>
    </html>
  );
}
