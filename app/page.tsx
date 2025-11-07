import Hero from '@/components/Hero';
import SmallBusinessSection from '@/components/SmallBusinessSection';
import LocalAISection from '@/components/LocalAISection';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />

      <SmallBusinessSection />

      <LocalAISection />
    </main>
  );
}
