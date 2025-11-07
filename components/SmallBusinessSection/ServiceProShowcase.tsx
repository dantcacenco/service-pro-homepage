'use client';

import { motion } from 'framer-motion';

export default function ServiceProShowcase() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 p-8 shadow-xl"
    >
      <div className="mb-8 text-center">
        <h3 className="mb-2 text-3xl font-bold text-text-dark">
          ServicePro+ Dashboard: One Place, Everything
        </h3>
        <p className="mx-auto max-w-2xl text-text-light">
          Stop juggling 5 different apps. From first contact to final payment, keep everything organized in one place.
        </p>
      </div>

      {/* Workflow Diagram */}
      <div className="mb-10 overflow-x-auto">
        <div className="mx-auto flex min-w-max items-center justify-center gap-4 px-4">
          {/* Proposal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col items-center"
          >
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <span className="text-3xl">📝</span>
            </div>
            <p className="text-center text-sm font-semibold text-text-dark">Proposal</p>
          </motion.div>

          {/* Arrow */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <svg className="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </motion.div>

          {/* Estimate */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-col items-center"
          >
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg">
              <span className="text-3xl">💰</span>
            </div>
            <p className="text-center text-sm font-semibold text-text-dark">Estimate</p>
          </motion.div>

          {/* Arrow */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <svg className="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </motion.div>

          {/* Project */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="flex flex-col items-center"
          >
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
              <span className="text-3xl">🔨</span>
            </div>
            <p className="text-center text-sm font-semibold text-text-dark">Project</p>
          </motion.div>

          {/* Arrow */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <svg className="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </motion.div>

          {/* Invoice */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="flex flex-col items-center"
          >
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
              <span className="text-3xl">📄</span>
            </div>
            <p className="text-center text-sm font-semibold text-text-dark">Invoice</p>
          </motion.div>

          {/* Arrow */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.8 }}
          >
            <svg className="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </motion.div>

          {/* Payment */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.9 }}
            className="flex flex-col items-center"
          >
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-center text-sm font-semibold text-text-dark">Payment</p>
          </motion.div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[
          {
            icon: '👥',
            title: 'Employee Coordination',
            description: 'Assign tasks, track progress, keep everyone in the loop',
          },
          {
            icon: '📅',
            title: 'Project Timeline',
            description: "See what's happening today, this week, this month",
          },
          {
            icon: '💬',
            title: 'Customer History',
            description: 'Every email, call, and note in one place',
          },
          {
            icon: '📊',
            title: 'Budget Tracking',
            description: "Know if you're making money before the job is done",
          },
          {
            icon: '🔔',
            title: 'Payment Reminders',
            description: 'Automated follow-ups for overdue invoices',
          },
          {
            icon: '📱',
            title: 'Mobile Access',
            description: 'Update jobs from the field, not just the office',
          },
        ].map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 * index }}
            className="rounded-xl bg-white p-6 shadow-md transition-all hover:shadow-lg"
          >
            <div className="mb-3 text-4xl">{feature.icon}</div>
            <h4 className="mb-2 text-lg font-bold text-text-dark">{feature.title}</h4>
            <p className="text-sm text-text-light">{feature.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Real-World Validation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="rounded-xl border-2 border-primary/20 bg-white p-6 text-center"
      >
        <div className="mb-3 text-4xl">⭐</div>
        <p className="mx-auto max-w-2xl text-lg font-semibold text-text-dark">
          "Already helping a local HVAC business streamline their flow from proposal to invoicing, keeping communication between projects and 10+ employees organized."
        </p>
        <p className="mt-3 text-sm font-medium text-primary">Real client, real results</p>
      </motion.div>
    </motion.div>
  );
}
