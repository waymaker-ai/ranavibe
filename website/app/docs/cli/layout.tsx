import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const title = 'CLI Reference | CoFounder Framework';
const description =
  'Install and use the CoFounder CLI with command examples for project setup, security checks, prompt management, cost reporting, and CI/CD workflows.';
const canonical = 'https://cofounder.cx/docs/cli';

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

export default function CliDocsLayout({ children }: { children: ReactNode }) {
  return children;
}
