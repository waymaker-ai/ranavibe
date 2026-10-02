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
