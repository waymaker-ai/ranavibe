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
    default: 'CoFounder - Open-Source Guardrails for AI Agents',
    template: '%s | CoFounder Framework',
  },
  description: 'Free, open-source (MIT) guardrails for AI agents and AI-assisted development: PII redaction, prompt-injection blocking, budget limits, and compliance checks for Claude Code, Vercel AI SDK, LangChain, CrewAI, and OpenClaw.',
  keywords: ['AI guardrails', 'AI safety', 'PII redaction', 'prompt injection', 'LLM', 'Claude Code', 'AI agents', 'open source', 'TypeScript', 'Waymaker'],
  authors: [{ name: 'Waymaker AI' }],
  creator: 'Waymaker AI',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://cofounder.cx',
    title: 'CoFounder - Open-Source Guardrails for AI Agents',
    description: 'Free, open-source (MIT) guardrails for AI agents and AI-assisted development: PII redaction, prompt-injection blocking, budget limits, and compliance checks for Claude Code, Vercel AI SDK, LangChain, CrewAI, and OpenClaw.',
    siteName: 'CoFounder Framework',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CoFounder - Open-Source Guardrails for AI Agents',
    description: 'Free, open-source (MIT) guardrails for AI agents and AI-assisted development: PII redaction, prompt-injection blocking, budget limits, and compliance checks for Claude Code, Vercel AI SDK, LangChain, CrewAI, and OpenClaw.',
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
    icon: '/favicon.svg',
    apple: '/apple-icon.svg',
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
