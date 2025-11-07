'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface Industry {
  id: string;
  name: string;
}

interface EmailTemplatesMiniDemoProps {
  activeIndustry: Industry;
}

// Sample emails by industry
const sampleEmails: Record<string, { type: string; subject: string; icon: string }[]> = {
  hvac: [
    { type: 'Appointment', subject: 'AC Service Tomorrow at 2pm', icon: '📅' },
    { type: 'Estimate', subject: 'Your HVAC System Quote - $4,500', icon: '💰' },
    { type: 'Payment', subject: 'Invoice Due: AC Repair', icon: '📄' },
  ],
  electrical: [
    { type: 'Appointment', subject: 'Panel Upgrade Monday 9am', icon: '📅' },
    { type: 'Estimate', subject: 'Electrical Estimate - $3,200', icon: '💰' },
    { type: 'Payment', subject: 'Invoice: Outlet Installation', icon: '📄' },
  ],
  plumbing: [
    { type: 'Appointment', subject: 'Water Heater Install Tomorrow', icon: '📅' },
    { type: 'Estimate', subject: 'Plumbing Work Estimate', icon: '💰' },
    { type: 'Payment', subject: 'Invoice: Emergency Repair', icon: '📄' },
  ],
  contractor: [
    { type: 'Appointment', subject: 'Kitchen Remodel Kickoff', icon: '📅' },
    { type: 'Estimate', subject: 'Full Remodel Estimate - $45k', icon: '💰' },
    { type: 'Payment', subject: 'Progress Payment Due', icon: '📄' },
  ],
};

export default function EmailTemplatesMiniDemo({ activeIndustry }: EmailTemplatesMiniDemoProps) {
  const emails = sampleEmails[activeIndustry.id];

  return (
    <div className="space-y-3">
      {/* Email Previews */}
      <div className="space-y-2">
        {emails.map((email, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
              <span className="text-xl">{email.icon}</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600">{email.type}</p>
              <p className="text-sm font-bold text-text-dark">{email.subject}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 p-2">
        <div className="text-center">
          <div className="text-lg">🎨</div>
          <p className="text-xs font-medium text-text-dark">Your Brand</p>
        </div>
        <div className="text-center">
          <div className="text-lg">📱</div>
          <p className="text-xs font-medium text-text-dark">Mobile</p>
        </div>
        <div className="text-center">
          <div className="text-lg">⚡</div>
          <p className="text-xs font-medium text-text-dark">Industry</p>
        </div>
      </div>

      {/* Try It Live Link */}
      <Link
        href="/email-builder"
        className="block rounded-lg bg-gradient-to-r from-primary to-accent py-2 text-center text-sm font-semibold text-white transition-all hover:scale-105"
      >
        Try Full Builder →
      </Link>
    </div>
  );
}
