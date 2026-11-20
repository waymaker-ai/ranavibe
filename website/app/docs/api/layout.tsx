import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const title = 'API Reference | CoFounder Framework';
const description =
  'Explore CoFounder package APIs, TypeScript signatures, configuration options, and examples for guardrails, compliance checks, and LLM integrations.';
const canonical = 'https://cofounder.cx/docs/api';

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'CoFounder Framework',
    title,
    description,
    url: canonical,
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@waylokai',
    title,
    description,
  },
};

export default function ApiDocsLayout({ children }: { children: ReactNode }) {
  return children;
}
