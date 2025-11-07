'use client';

import { motion } from 'framer-motion';

export default function ServiceProMiniDemo() {
  const workflow = [
    { icon: '📝', label: 'Quote', color: 'from-blue-500 to-blue-600' },
    { icon: '📋', label: 'Proposal', color: 'from-cyan-500 to-cyan-600' },
    { icon: '🔨', label: 'Project', color: 'from-purple-500 to-purple-600' },
    { icon: '📄', label: 'Invoice', color: 'from-orange-500 to-orange-600' },
    { icon: '💰', label: 'Payment', color: 'from-green-500 to-green-600' },
  ];

  return (
    <div className="space-y-4">
      {/* Mini Workflow */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
        {workflow.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br shadow-md ${step.color}`}
            >
              <span className="text-2xl">{step.icon}</span>
            </motion.div>
            <p className="text-xs font-semibold text-text-dark">{step.label}</p>
            {index < workflow.length - 1 && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                className="absolute left-full top-7 h-0.5 w-4 bg-gradient-to-r from-primary to-accent"
                style={{ transformOrigin: 'left' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Key Features Grid */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: '👥', text: 'Team Coordination' },
          { icon: '📊', text: 'Budget Tracking' },
          { icon: '💬', text: 'Client Messages' },
          { icon: '🔔', text: 'Auto Reminders' },
        ].map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
            className="flex items-center gap-2 rounded-lg bg-white p-2"
          >
            <span className="text-xl">{feature.icon}</span>
            <span className="text-xs font-medium text-text-dark">{feature.text}</span>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div className="rounded-lg bg-primary/5 p-3 text-center">
        <p className="text-xs font-semibold text-primary">
          Full dashboard demo coming soon
        </p>
      </div>
    </div>
  );
}
