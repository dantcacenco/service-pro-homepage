'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CompanyCamMiniDemo from './SmallBusinessSection/CompanyCamMiniDemo';
import ServiceProMiniDemo from './SmallBusinessSection/ServiceProMiniDemo';
import EmailTemplatesMiniDemo from './SmallBusinessSection/EmailTemplatesMiniDemo';

gsap.registerPlugin(ScrollTrigger);

// Solution Card Component with Dropdown
interface SolutionCardProps {
  title: string;
  description: string;
  features: string[];
  delay: number;
  children: React.ReactNode;
}

function SolutionCard({ title, description, features, delay, children }: SolutionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-xl transition-all hover:shadow-2xl"
    >
      <div className="mb-4">
        <h4 className="text-xl md:text-2xl font-bold text-text-dark">{title}</h4>
      </div>
      <p className="mb-6 text-sm md:text-base text-text-light">{description}</p>
      <div className="mb-6 space-y-2 text-sm text-text-light">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-primary">✓</span>
            <span>{feature}</span>
          </div>
        ))}
      </div>

      {/* See Demo Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="group flex w-full items-center justify-between rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 px-4 py-3 font-semibold text-primary transition-all hover:from-primary/20 hover:to-accent/20"
      >
        <span>{isExpanded ? 'Hide Demo' : 'See Demo'}</span>
        <motion.svg
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      {/* Collapsible Demo Area */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-6 rounded-xl bg-secondary/50 p-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface Industry {
  id: string;
  name: string;
  icon: string;
  painPointHeadline: string;
  painPointSubtext: string;
  colorAccent: string;
  gradientFrom: string;
  gradientTo: string;
}

const industries: Industry[] = [
  {
    id: 'hvac',
    name: 'HVAC',
    icon: '❄️',
    painPointHeadline: 'Drowning in service calls, buried in paperwork?',
    painPointSubtext:
      'Between emergency calls, seasonal rushes, and keeping customers updated, you barely have time to run your business. Let alone keep track of photos, estimates, and invoices.',
    colorAccent: '#3B82F6', // Cool blue
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-cyan-500',
  },
  {
    id: 'electrical',
    name: 'Electrical',
    icon: '⚡',
    painPointHeadline: 'Code compliance, safety docs, and change orders overwhelming you?',
    painPointSubtext:
      'Electrical work demands precision documentation. One missed photo or unsigned change order can cost you thousands. You need systems that work as reliably as your installations.',
    colorAccent: '#F59E0B', // Amber
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-yellow-500',
  },
  {
    id: 'plumbing',
    name: 'Plumbing',
    icon: '🔧',
    painPointHeadline: 'Emergency calls at 2am, warranty claims, parts tracking chaos?',
    painPointSubtext:
      'When pipes burst, customers panic. But tracking which parts you used, documenting the job, and following up for payment? That shouldn\'t keep you up at night too.',
    colorAccent: '#0EA5E9', // Deep blue
    gradientFrom: 'from-blue-600',
    gradientTo: 'to-cyan-600',
  },
  {
    id: 'contractor',
    name: 'GC',
    icon: '🏗️',
    painPointHeadline: 'Juggling subs, timelines, and budgets is exhausting?',
    painPointSubtext:
      'Coordinating 5 different trades, keeping homeowners happy, chasing payments, and staying on budget. You\'re managing a small army, but your "system" is scattered across texts, emails, and sticky notes.',
    colorAccent: '#EF4444', // Construction orange-red
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-red-500',
  },
];

export default function SmallBusinessSection() {
  const [activeIndustry, setActiveIndustry] = useState<Industry>(industries[0]);
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Fade in section on scroll
      gsap.from(sectionRef.current, {
        opacity: 0,
        y: 100,
        duration: 1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          end: 'top 50%',
          scrub: 1,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleIndustryChange = (industry: Industry) => {
    setActiveIndustry(industry);
  };

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen bg-gradient-to-b from-white to-secondary py-20"
      id="small-business-solutions"
    >
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-4 text-3xl font-bold text-text-dark md:text-4xl"
          >
            Built for the Trades
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-2xl text-base md:text-lg text-text-light"
          >
            Real solutions for real problems. No corporate fluff, just tools that help you get the job done and get paid.
          </motion.p>
        </div>

        {/* Industry Selector Tabs */}
        <div className="mb-12 flex justify-center">
          <div className="inline-flex flex-wrap justify-center gap-2 rounded-full bg-white p-1.5 md:p-2 shadow-lg">
            {industries.map((industry) => (
              <button
                key={industry.id}
                onClick={() => handleIndustryChange(industry)}
                className={`group relative flex items-center gap-1.5 md:gap-2 rounded-full px-3 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold transition-all duration-300 ${
                  activeIndustry.id === industry.id
                    ? 'bg-gradient-to-r text-white shadow-md'
                    : 'text-text-light hover:bg-secondary'
                }`}
                style={
                  activeIndustry.id === industry.id
                    ? {
                        backgroundImage: `linear-gradient(to right, ${industry.colorAccent}, ${industry.colorAccent}dd)`,
                      }
                    : undefined
                }
              >
                <span className="text-lg md:text-2xl">{industry.icon}</span>
                <span>{industry.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pain Point Headline */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndustry.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="mb-16 text-center"
          >
            <h3
              ref={headlineRef}
              className="mb-4 text-2xl font-bold text-text-dark md:text-3xl"
            >
              {activeIndustry.painPointHeadline}
            </h3>
            <p className="mx-auto max-w-3xl text-base md:text-lg leading-relaxed text-text-light">
              {activeIndustry.painPointSubtext}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Three Solution Cards */}
        <div className="mb-16 grid gap-8 md:grid-cols-3">
          {/* CompanyCam+ Card */}
          <SolutionCard
            title="CompanyCam+"
            description="Show the hidden quality work that justifies your premium pricing. Track 5, 10+ photos per location over time, perfectly aligned."
            features={[
              'Timeline slider with photos from different dates',
              'Transparent overlay for perfect alignment',
              'Solves 100-500+ photo chaos problem',
            ]}
            delay={0.1}
          >
            <CompanyCamMiniDemo activeIndustry={activeIndustry} />
          </SolutionCard>

          {/* ServicePro+ Card */}
          <SolutionCard
            title="ServicePro+ Dashboard"
            description="One place for everything - from quote to cash. Already helping a local HVAC business keep 10+ employees organized."
            features={[
              'Proposal → invoice pipeline',
              'Employee coordination hub',
              'Project & payment tracking',
            ]}
            delay={0.2}
          >
            <ServiceProMiniDemo />
          </SolutionCard>

          {/* Email Templates Card */}
          <SolutionCard
            title="AI-Powered Email Templates"
            description="Look professional, get paid faster, get more 5-star reviews. Branded emails that match your business."
            features={[
              'Appointment confirmations',
              'Estimates & invoices',
              'Payment reminders & follow-ups',
            ]}
            delay={0.3}
          >
            <EmailTemplatesMiniDemo activeIndustry={activeIndustry} />
          </SolutionCard>
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 text-center"
        >
          <a
            href="https://calendly.com/volk_productions/new-meeting"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full bg-gradient-to-r from-primary to-accent px-8 md:px-10 py-3 md:py-4 text-base md:text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          >
            Start Streamlining Your Business
          </a>
          <p className="mt-4 text-xs md:text-sm text-text-light">
            Free consultation • No sales pressure • Just solutions
          </p>
        </motion.div>
      </div>
    </section>
  );
}
