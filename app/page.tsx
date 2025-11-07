import Hero from '@/components/Hero';
import ScrollAnimationSection from '@/components/ScrollAnimationSection';
import LocalAISection from '@/components/LocalAISection';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />

      <ScrollAnimationSection
        title="AI-Powered Email Templates"
        description="Create stunning email campaigns that match your brand in minutes. Our AI learns your style preferences and generates custom templates tailored to your business."
        features={[
          'Rank templates to teach the AI your aesthetic preferences',
          'Generate custom designs that work across all email clients',
          'Edit with natural language - just tell it what you want',
          'Send test emails to see exactly how they look',
        ]}
      />

      <LocalAISection />

      {/* Placeholder for more sections */}
      <section className="flex min-h-screen items-center justify-center bg-secondary">
        <div className="container mx-auto px-6 text-center">
          <h2 className="mb-6 text-4xl font-bold text-text-dark">
            More Amazing Features Coming Soon
          </h2>
          <p className="text-lg text-text-light">
            Interactive demos, photo progress tracking, AI chatbot, and more...
          </p>
        </div>
      </section>
    </main>
  );
}
