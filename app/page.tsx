import Hero from '@/components/Hero';
import SmallBusinessSection from '@/components/SmallBusinessSection';
import CaseStudiesSection from '@/components/CaseStudiesSection';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />

      <SmallBusinessSection />

      <CaseStudiesSection />
    </main>
  );
}
