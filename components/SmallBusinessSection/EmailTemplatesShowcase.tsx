'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface Industry {
  id: string;
  name: string;
  icon: string;
  colorAccent: string;
}

interface EmailTemplatesShowcaseProps {
  activeIndustry: Industry;
}

// Email template examples by industry
const emailExamples = {
  hvac: {
    appointment: {
      subject: 'Your AC Service Appointment Tomorrow at 2pm',
      preview: "Hi Sarah, Just confirming we'll be there tomorrow (June 15) at 2pm for your annual AC maintenance...",
    },
    estimate: {
      subject: 'Your HVAC System Replacement Estimate',
      preview: "Thanks for choosing us! Here's your detailed estimate for the new 3-ton system installation...",
    },
    payment: {
      subject: 'Invoice Due: AC Repair - Unit #12345',
      preview: 'Hi John, This is a friendly reminder that invoice #4821 for $485 is due in 3 days...',
    },
  },
  electrical: {
    appointment: {
      subject: 'Panel Upgrade Scheduled for Monday 9am',
      preview: 'Hi Mike, Confirming your 200A panel upgrade scheduled for Monday, June 19 at 9am...',
    },
    estimate: {
      subject: 'Electrical Panel Upgrade Estimate - $3,200',
      preview: "Thanks for the opportunity! Here's your estimate for upgrading to a 200A service panel...",
    },
    payment: {
      subject: 'Invoice Ready: Outlet Installation Complete',
      preview: 'Hi Lisa, Work is complete! Invoice #5103 for $650 is attached. Net 15 terms...',
    },
  },
  plumbing: {
    appointment: {
      subject: 'Water Heater Installation Tomorrow at 10am',
      preview: 'Hi Robert, Ready to install your new 50-gallon water heater tomorrow at 10am...',
    },
    estimate: {
      subject: 'Estimate: Bathroom Plumbing Renovation',
      preview: "Thanks for reaching out! Here's your estimate for the bathroom plumbing work...",
    },
    payment: {
      subject: 'Invoice Due: Emergency Pipe Repair',
      preview: 'Hi Jennifer, Thanks for choosing us for your emergency repair. Invoice #6234 attached...',
    },
  },
  contractor: {
    appointment: {
      subject: 'Kitchen Remodel Kickoff Meeting - Tuesday 3pm',
      preview: "Hi David, Excited to start your kitchen remodel! Let's meet Tuesday at 3pm to finalize details...",
    },
    estimate: {
      subject: 'Full Kitchen Remodel Estimate - $45,000',
      preview: "Thanks for considering us! Here's your detailed estimate for the complete kitchen renovation...",
    },
    payment: {
      subject: 'Progress Payment Due: Kitchen 50% Complete',
      preview: "Hi Susan, Great progress! We're 50% done. 2nd progress payment of $15,000 is due...",
    },
  },
};

export default function EmailTemplatesShowcase({ activeIndustry }: EmailTemplatesShowcaseProps) {
  const examples = emailExamples[activeIndustry.id as keyof typeof emailExamples];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="rounded-2xl bg-white p-8 shadow-xl"
    >
      <div className="mb-8 text-center">
        <h3 className="mb-2 text-3xl font-bold text-text-dark">
          AI-Powered Email Templates
        </h3>
        <p className="mx-auto max-w-2xl text-text-light">
          Look professional, get paid faster, get more 5-star reviews. Branded emails that match your business.
        </p>
      </div>

      {/* Email Examples Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        {/* Appointment Confirmation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="group overflow-hidden rounded-xl border-2 border-gray-200 bg-gradient-to-br from-blue-50 to-white transition-all hover:border-primary hover:shadow-lg"
        >
          <div className="border-b-2 border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <p className="text-xs font-semibold text-gray-600">Appointment</p>
            </div>
            <p className="text-sm font-bold text-text-dark">{examples.appointment.subject}</p>
          </div>
          <div className="p-4">
            <p className="text-sm leading-relaxed text-text-light">
              {examples.appointment.preview}
            </p>
          </div>
          <div className="bg-gradient-to-t from-gray-50 to-transparent p-4 pt-8">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>✓</span>
              <span>Reduces no-shows by 60%</span>
            </div>
          </div>
        </motion.div>

        {/* Estimate Delivery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="group overflow-hidden rounded-xl border-2 border-gray-200 bg-gradient-to-br from-purple-50 to-white transition-all hover:border-primary hover:shadow-lg"
        >
          <div className="border-b-2 border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-purple-500"></div>
              <p className="text-xs font-semibold text-gray-600">Estimate</p>
            </div>
            <p className="text-sm font-bold text-text-dark">{examples.estimate.subject}</p>
          </div>
          <div className="p-4">
            <p className="text-sm leading-relaxed text-text-light">
              {examples.estimate.preview}
            </p>
          </div>
          <div className="bg-gradient-to-t from-gray-50 to-transparent p-4 pt-8">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>✓</span>
              <span>Win 30% more jobs</span>
            </div>
          </div>
        </motion.div>

        {/* Payment Reminder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="group overflow-hidden rounded-xl border-2 border-gray-200 bg-gradient-to-br from-green-50 to-white transition-all hover:border-primary hover:shadow-lg"
        >
          <div className="border-b-2 border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-500"></div>
              <p className="text-xs font-semibold text-gray-600">Payment</p>
            </div>
            <p className="text-sm font-bold text-text-dark">{examples.payment.subject}</p>
          </div>
          <div className="p-4">
            <p className="text-sm leading-relaxed text-text-light">
              {examples.payment.preview}
            </p>
          </div>
          <div className="bg-gradient-to-t from-gray-50 to-transparent p-4 pt-8">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>✓</span>
              <span>Get paid 2x faster</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Additional Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-8 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 p-6"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="text-center">
            <div className="mb-2 text-3xl">🎨</div>
            <p className="text-sm font-semibold text-text-dark">Your Brand Colors</p>
            <p className="text-xs text-text-light">Matches your logo perfectly</p>
          </div>
          <div className="text-center">
            <div className="mb-2 text-3xl">📱</div>
            <p className="text-sm font-semibold text-text-dark">Mobile-Friendly</p>
            <p className="text-xs text-text-light">Looks great on any device</p>
          </div>
          <div className="text-center">
            <div className="mb-2 text-3xl">⚡</div>
            <p className="text-sm font-semibold text-text-dark">Industry-Specific</p>
            <p className="text-xs text-text-light">Content made for {activeIndustry.name}</p>
          </div>
        </div>
      </motion.div>

      {/* Try It Live Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <Link
          href="/email-builder"
          className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary to-accent px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
        >
          <span>Try It Live</span>
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>
        <p className="mt-3 text-sm text-text-light">
          Create your custom branded emails in 3 minutes
        </p>
      </motion.div>
    </motion.div>
  );
}
