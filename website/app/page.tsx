import { Hero } from '@/components/hero';
import { Packages } from '@/components/packages';
import { CodeComparison } from '@/components/code-comparison';
import { HowItWorks } from '@/components/how-it-works';
import { Features } from '@/components/features';
import { Ecosystem } from '@/components/ecosystem';
import { CTASection } from '@/components/cta-section';

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'Organization', '@id': 'https://cofounder.cx/#organization', name: 'Waymaker AI', url: 'https://cofounder.cx/' },
          { '@type': 'WebSite', '@id': 'https://cofounder.cx/#website', name: 'CoFounder', url: 'https://cofounder.cx/', publisher: { '@id': 'https://cofounder.cx/#organization' } },
          { '@type': 'WebPage', '@id': 'https://cofounder.cx/#webpage', url: 'https://cofounder.cx/', name: 'CoFounder - Open-Source Guardrails for AI Agents', isPartOf: { '@id': 'https://cofounder.cx/#website' }, description: 'Free, open-source guardrails for AI agents and AI-assisted development.', inLanguage: 'en' }
        ]
      }).replace(/</g, '\\u003c') }} />
      <Hero />
      <CodeComparison />
      <HowItWorks />
      <Packages />
      <Features />
      <Ecosystem />
      <CTASection />
    </>
  );
}
