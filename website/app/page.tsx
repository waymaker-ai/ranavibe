import { Hero } from '@/components/hero';
import { Packages } from '@/components/packages';
import { Features } from '@/components/features';
import { CTASection } from '@/components/cta-section';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Packages />
      <Features />
      <CTASection />
    </>
  );
}
