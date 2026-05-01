'use client'

import { motion } from 'framer-motion'

const features = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Resume Parsing',
    description:
      'Our NLP engine extracts skills, experience, education, and achievements from any resume format — PDF, Word, or plain text — in seconds.',
    color: 'primary',
    gradient: 'from-primary/20 to-cyan-400/10',
    borderColor: 'border-primary/30',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    highlights: ['PDF & DOCX support', 'Skills extraction', 'Experience timeline'],
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'Smart Matching',
    description:
      'A multi-signal AI model scores every job against your profile — weighing skills, seniority, location preference, salary, and culture fit.',
    color: 'secondary',
    gradient: 'from-secondary/20 to-purple-400/10',
    borderColor: 'border-secondary/30',
    iconBg: 'bg-secondary/10',
    iconColor: 'text-purple-400',
    highlights: ['Multi-signal scoring', 'Preference learning', 'Daily refreshes'],
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: 'Application Tracking',
    description:
      'A built-in kanban board tracks every application from submission through offer. Never lose track of where you stand.',
    color: 'success',
    gradient: 'from-emerald-500/20 to-teal-400/10',
    borderColor: 'border-emerald-500/30',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    highlights: ['Kanban pipeline', 'Status notifications', 'Interview calendar'],
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function Features() {
  return (
    <section id="features" className="relative py-28 overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-dot-pattern opacity-30" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface border border-border text-muted mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
            The Full Stack
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-text mb-4">
            Everything you need to{' '}
            <span className="text-gradient">land the job</span>
          </h2>
          <p className="text-lg text-muted max-w-xl mx-auto">
            From resume analysis to offer negotiation — one intelligent platform that handles the heavy lifting.
          </p>
        </motion.div>

        {/* Feature cards grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid md:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              className={`relative group bg-surface border ${feature.borderColor} rounded-2xl p-7 overflow-hidden hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1`}
            >
              {/* Gradient fill on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              <div className="relative z-10">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center h-13 w-13 rounded-xl ${feature.iconBg} ${feature.iconColor} mb-5 p-3 border ${feature.borderColor}`}>
                  {feature.icon}
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-bold text-text mb-3">{feature.title}</h3>
                <p className="text-muted text-sm leading-relaxed mb-6">{feature.description}</p>

                {/* Highlights */}
                <ul className="space-y-2">
                  {feature.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-center gap-2 text-xs text-text-secondary">
                      <svg className={`w-4 h-4 flex-shrink-0 ${feature.iconColor}`} viewBox="0 0 16 16" fill="none">
                        <path
                          d="M3 8l3.5 3.5 6.5-7"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 py-10 border-t border-b border-border"
        >
          {[
            { value: '50k+', label: 'Jobs indexed daily' },
            { value: '94%', label: 'Match accuracy' },
            { value: '3.2x', label: 'Faster than manual search' },
            { value: '12k+', label: 'Placements this year' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl font-bold text-gradient mb-1">{stat.value}</div>
              <div className="text-sm text-muted">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
