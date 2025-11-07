'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CompanyCamDemo from './SmallBusinessSection/CompanyCamDemo';
import ServiceProShowcase from './SmallBusinessSection/ServiceProShowcase';
import EmailTemplatesShowcase from './SmallBusinessSection/EmailTemplatesShowcase';

gsap.registerPlugin(ScrollTrigger);

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
    name: 'General Contractor',
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
            className="mb-4 text-4xl font-bold text-text-dark md:text-5xl"
          >
            Built for the Trades
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-2xl text-lg text-text-light"
          >
            Real solutions for real problems. No corporate fluff, just tools that help you get the job done and get paid.
          </motion.p>
        </div>

        {/* Industry Selector Tabs */}
        <div className="mb-12 flex justify-center">
          <div className="inline-flex flex-wrap justify-center gap-3 rounded-full bg-white p-2 shadow-lg">
            {industries.map((industry) => (
              <button
                key={industry.id}
                onClick={() => handleIndustryChange(industry)}
                className={`group relative flex items-center gap-2 rounded-full px-6 py-3 font-semibold transition-all duration-300 ${
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
                <span className="text-2xl">{industry.icon}</span>
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
              className="mb-4 text-3xl font-bold text-text-dark md:text-4xl"
            >
              {activeIndustry.painPointHeadline}
            </h3>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-text-light">
              {activeIndustry.painPointSubtext}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Three Solution Cards */}
        <div className="mb-16 grid gap-8 md:grid-cols-3">
          {/* CompanyCam+ Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-xl transition-all hover:shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between">
              <h4 className="text-2xl font-bold text-text-dark">CompanyCam+</h4>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Interactive Demo
              </span>
            </div>
            <p className="mb-6 text-text-light">
              Professional photo documentation that shows homeowners exactly what you're doing, when you're doing it. No more "he said, she said."
            </p>
            <div className="mb-4 space-y-2 text-sm text-text-light">
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Before/after comparison slider</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>GPS & timestamp on every photo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Share updates with customers instantly</span>
              </div>
            </div>
          </motion.div>

          {/* ServicePro+ Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-xl transition-all hover:shadow-2xl"
          >
            <div className="mb-4">
              <h4 className="text-2xl font-bold text-text-dark">ServicePro+ Dashboard</h4>
            </div>
            <p className="mb-6 text-text-light">
              One place for everything - from quote to cash. Already helping a local HVAC business keep 10+ employees organized.
            </p>
            <div className="mb-4 space-y-2 text-sm text-text-light">
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Proposal → invoice pipeline</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Employee coordination hub</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Project & payment tracking</span>
              </div>
            </div>
          </motion.div>

          {/* Email Templates Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-xl transition-all hover:shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between">
              <h4 className="text-2xl font-bold text-text-dark">Email Templates</h4>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                Live Demo Available
              </span>
            </div>
            <p className="mb-6 text-text-light">
              Look professional, get paid faster, get more 5-star reviews. Branded emails that match your business.
            </p>
            <div className="mb-4 space-y-2 text-sm text-text-light">
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Appointment confirmations</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Estimates & invoices</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Payment reminders & follow-ups</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Demo Areas */}
        <div className="space-y-16">
          {/* CompanyCam+ Demo */}
          <CompanyCamDemo activeIndustry={activeIndustry} />

          {/* ServicePro+ Showcase */}
          <ServiceProShowcase />

          {/* Email Templates Showcase */}
          <EmailTemplatesShowcase activeIndustry={activeIndustry} />
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
            className="inline-block rounded-full bg-gradient-to-r from-primary to-accent px-10 py-5 text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          >
            Start Streamlining Your Business
          </a>
          <p className="mt-4 text-sm text-text-light">
            Free consultation • No sales pressure • Just solutions
          </p>
        </motion.div>
      </div>
    </section>
  );
}
