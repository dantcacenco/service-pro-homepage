'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface Industry {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  useCases: string[];
  color: string;
}

const industries: Industry[] = [
  {
    id: 'healthcare',
    name: 'Healthcare & Clinics',
    icon: '🏥',
    tagline: 'HIPAA-Compliant Clinical Intelligence',
    useCases: [
      'Find patients with similar symptom patterns',
      'Treatment protocol recommendations',
      'Drug interaction checking',
      'Automated prior authorization letters',
    ],
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'legal',
    name: 'Legal Firms',
    icon: '⚖️',
    tagline: 'Attorney-Client Privilege Protected',
    useCases: [
      'Case precedent research',
      'Contract clause analysis',
      'Document discovery automation',
      'Legal memo generation',
    ],
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'financial',
    name: 'Financial Services',
    icon: '💼',
    tagline: 'SEC-Compliant Financial Analysis',
    useCases: [
      'Fraud pattern detection',
      'Portfolio risk analysis',
      'Regulatory compliance checking',
      'Market trend analysis',
    ],
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    icon: '🏭',
    tagline: 'Proprietary Process Protection',
    useCases: [
      'Predictive equipment maintenance',
      'Quality control anomaly detection',
      'Supply chain optimization',
      'Production efficiency analysis',
    ],
    color: 'from-orange-500 to-red-500',
  },
];

export default function LocalAISection() {
  const sectionRef = useRef<HTMLElement>(null);
  const dataFlowRef = useRef<HTMLDivElement>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>(industries[0].id);

  useEffect(() => {
    if (!sectionRef.current || !dataFlowRef.current) return;

    const ctx = gsap.context(() => {
      // Animate data flow visualization on scroll
      gsap.to('.data-particle', {
        y: -100,
        opacity: 0,
        stagger: 0.2,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top center',
          end: 'center center',
          scrub: 1,
        },
      });

      // Fade in industry cards
      gsap.from('.industry-card', {
        opacity: 0,
        y: 50,
        stagger: 0.15,
        duration: 0.8,
        scrollTrigger: {
          trigger: '.industry-grid',
          start: 'top 80%',
          end: 'top 50%',
          scrub: 1,
        },
      });

      // Animate compliance badges
      gsap.from('.compliance-badge', {
        scale: 0,
        rotation: -180,
        stagger: 0.1,
        scrollTrigger: {
          trigger: '.compliance-section',
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const currentIndustry = industries.find((ind) => ind.id === selectedIndustry) || industries[0];

  return (
    <section ref={sectionRef} className="relative min-h-screen bg-gradient-to-b from-white to-secondary py-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #3B82F6 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="container relative mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <div className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5">
            <span className="text-xs md:text-sm font-semibold text-primary">🔒 Your Data Never Leaves Your Premises</span>
          </div>
          <h2 className="mb-6 text-3xl md:text-4xl font-bold text-text-dark">
            Local HIPAA-Compliant AI
          </h2>
          <p className="mx-auto max-w-3xl text-base md:text-lg text-text-light">
            State-of-the-art AI that runs entirely on your infrastructure.
            No cloud uploads. No data breaches. Complete control.
          </p>
        </motion.div>

        {/* Data Flow Visualization */}
        <div ref={dataFlowRef} className="relative mb-20 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 p-4 md:p-8">
          <div className="mx-auto max-w-4xl">
            <div className="relative flex items-center justify-between gap-2 md:gap-0">
              {/* Local Device */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="flex flex-col items-center"
              >
                <div className="mb-2 md:mb-4 flex h-16 w-16 md:h-24 md:w-24 items-center justify-center rounded-xl md:rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg md:shadow-2xl">
                  <span className="text-3xl md:text-5xl">💻</span>
                </div>
                <p className="text-center text-xs md:text-base font-semibold text-text-dark">Your Device</p>
                <p className="text-xs md:text-sm text-text-light hidden md:block">On-Premise Server</p>
              </motion.div>

              {/* Data Flow Animation */}
              <div className="relative flex-1 px-2 md:px-8">
                <div className="relative h-1 md:h-2 w-full rounded-full bg-primary/20">
                  <motion.div
                    className="absolute left-0 top-0 h-1 md:h-2 rounded-full bg-gradient-to-r from-primary to-accent"
                    animate={{ width: ['0%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>

                {/* Animated particles */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="data-particle absolute -top-4 md:-top-8 h-2 w-2 md:h-4 md:w-4 rounded-full bg-accent"
                    style={{ left: `${i * 20}%` }}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                  />
                ))}

                <p className="mt-4 md:mt-6 text-center text-xs md:text-sm font-semibold text-primary">
                  ✓ Encrypted • ✓ Local • ✓ Zero Cloud
                </p>
              </div>

              {/* Local AI */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="flex flex-col items-center"
              >
                <div className="mb-2 md:mb-4 flex h-16 w-16 md:h-24 md:w-24 items-center justify-center rounded-xl md:rounded-2xl bg-gradient-to-br from-accent to-primary shadow-lg md:shadow-2xl">
                  <span className="text-3xl md:text-5xl">🗄️</span>
                </div>
                <p className="text-center text-xs md:text-base font-semibold text-text-dark">Local AI</p>
                <p className="text-xs md:text-sm text-text-light hidden md:block">State-of-the-Art LLM</p>
              </motion.div>
            </div>

            {/* Example Query */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="mt-8 md:mt-12 rounded-xl bg-white p-4 md:p-6 shadow-lg"
            >
              <div className="mb-2 md:mb-3 flex items-center gap-2">
                <span className="text-xl md:text-2xl">💬</span>
                <span className="text-sm md:text-base font-semibold text-text-dark">Example Query:</span>
              </div>
              <p className="mb-3 md:mb-4 text-sm md:text-base italic text-text-light">
                "Show me patients with similar symptom patterns to the current case"
              </p>
              <div className="rounded-lg bg-green-50 p-3 md:p-4">
                <p className="text-xs md:text-sm font-semibold text-green-800">✓ Processed locally in 2.3 seconds</p>
                <p className="text-xs text-green-600">No data sent to external servers</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Industry Use Cases */}
        <div className="industry-grid mb-20">
          <h3 className="mb-6 md:mb-8 text-center text-2xl md:text-3xl font-bold text-text-dark">
            Trusted by Regulated Industries
          </h3>

          <div className="mb-6 md:mb-8 flex flex-wrap justify-center gap-2 md:gap-4">
            {industries.map((industry) => (
              <button
                key={industry.id}
                onClick={() => setSelectedIndustry(industry.id)}
                className={`rounded-full px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold transition-all ${
                  selectedIndustry === industry.id
                    ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg scale-105'
                    : 'bg-white text-text-dark hover:bg-gray-50'
                }`}
              >
                <span className="mr-1 md:mr-2">{industry.icon}</span>
                {industry.name}
              </button>
            ))}
          </div>

          {/* Selected Industry Details */}
          <motion.div
            key={currentIndustry.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`mx-auto max-w-4xl rounded-2xl bg-gradient-to-br ${currentIndustry.color} p-1 shadow-2xl`}
          >
            <div className="rounded-2xl bg-white p-4 md:p-8">
              <div className="mb-4 md:mb-6 flex items-center gap-3 md:gap-4">
                <span className="text-4xl md:text-6xl">{currentIndustry.icon}</span>
                <div>
                  <h4 className="text-lg md:text-2xl font-bold text-text-dark">{currentIndustry.name}</h4>
                  <p className="text-sm md:text-base text-text-light">{currentIndustry.tagline}</p>
                </div>
              </div>

              <div className="grid gap-3 md:gap-4 md:grid-cols-2">
                {currentIndustry.useCases.map((useCase, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-start gap-2 md:gap-3 rounded-lg bg-gradient-to-br from-gray-50 to-white p-3 md:p-4"
                  >
                    <span className="text-lg md:text-xl">✓</span>
                    <p className="text-sm md:text-base text-text-dark">{useCase}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Compliance & Security Badges */}
        <div className="compliance-section">
          <h3 className="mb-6 md:mb-8 text-center text-2xl md:text-3xl font-bold text-text-dark">
            Enterprise-Grade Security
          </h3>

          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            {[
              { label: 'HIPAA', icon: '🏥' },
              { label: 'SOC 2', icon: '🔒' },
              { label: 'GDPR', icon: '🇪🇺' },
              { label: 'ISO 27001', icon: '📋' },
              { label: 'On-Premise', icon: '🏢' },
              { label: 'Air-Gapped', icon: '🔌' },
            ].map((badge, index) => (
              <motion.div
                key={badge.label}
                className="compliance-badge flex flex-col items-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <div className="mb-1 md:mb-2 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-lg">
                  <span className="text-2xl md:text-3xl">{badge.icon}</span>
                </div>
                <span className="text-xs md:text-sm font-semibold text-text-dark">{badge.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-16 md:mt-20 text-center"
        >
          <h3 className="mb-3 md:mb-4 text-2xl md:text-3xl font-bold text-text-dark">
            Ready to Keep Your Data Private?
          </h3>
          <p className="mb-6 md:mb-8 text-base md:text-lg text-text-light">
            Schedule a consultation to see how local AI can transform your operations
          </p>
          <a
            href="https://calendly.com/volk_productions/new-meeting"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full bg-gradient-to-r from-primary to-accent px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            Schedule a Consultation
          </a>
        </motion.div>
      </div>
    </section>
  );
}
