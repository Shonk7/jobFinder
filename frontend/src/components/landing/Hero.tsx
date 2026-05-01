'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'

const floatingPills = [
  { label: 'AI-Powered Matching', delay: 0, x: '-10%', y: '15%' },
  { label: 'Resume Parsing', delay: 0.5, x: '80%', y: '25%' },
  { label: '10k+ Jobs Daily', delay: 0.8, x: '-5%', y: '75%' },
  { label: 'Smart Alerts', delay: 0.3, x: '75%', y: '70%' },
  { label: 'Skills Analysis', delay: 1.1, x: '40%', y: '88%' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

// Dashboard mock preview
function DashboardPreview() {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Glow behind the card */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl rounded-3xl scale-110" />

      <div className="relative bg-surface border border-border rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
        {/* Mock header bar */}
        <div className="flex items-center gap-1.5 px-4 py-3 bg-surface-2 border-b border-border">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          <span className="ml-3 text-xs text-muted font-mono">jobfinder.app/dashboard</span>
        </div>

        {/* Mock sidebar + content */}
        <div className="flex h-64">
          {/* Mock sidebar */}
          <div className="w-28 bg-surface-2 border-r border-border p-3 flex flex-col gap-2 flex-shrink-0">
            {['Dashboard', 'Jobs', 'Resume', 'Settings'].map((item, i) => (
              <div
                key={item}
                className={`h-7 rounded-lg flex items-center px-2 gap-1.5 ${i === 0 ? 'bg-primary/15 border border-primary/25' : 'bg-transparent'}`}
              >
                <div className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-primary' : 'bg-muted/40'}`} />
                <div className={`h-1.5 rounded-full ${i === 0 ? 'bg-primary/50 w-14' : 'bg-muted/20 w-12'}`} />
              </div>
            ))}
          </div>

          {/* Mock content */}
          <div className="flex-1 p-4 overflow-hidden">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Matches', value: '47', color: 'text-primary' },
                { label: 'Applied', value: '12', color: 'text-purple-400' },
                { label: 'Profile', value: '85%', color: 'text-emerald-400' },
              ].map((stat) => (
                <div key={stat.label} className="bg-surface-2 rounded-lg p-2 border border-border">
                  <div className={`text-base font-bold font-display ${stat.color}`}>{stat.value}</div>
                  <div className="text-[9px] text-muted">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Mock job cards */}
            <div className="space-y-2">
              {[
                { role: 'Senior Engineer', co: 'TechCorp', match: '94%', matchColor: 'text-emerald-400' },
                { role: 'Frontend Dev', co: 'StartupXYZ', match: '87%', matchColor: 'text-primary' },
                { role: 'Full Stack Dev', co: 'Scale Inc', match: '79%', matchColor: 'text-primary' },
              ].map((job) => (
                <div key={job.role} className="bg-surface-2 rounded-lg p-2.5 border border-border flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-gradient-to-br from-primary/30 to-secondary/30 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold text-text truncate">{job.role}</div>
                    <div className="text-[9px] text-muted">{job.co}</div>
                  </div>
                  <div className={`text-[10px] font-bold ${job.matchColor}`}>{job.match}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating match score badge */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-4 -right-4 bg-surface border border-primary/30 rounded-xl px-3 py-2 shadow-glow-cyan"
      >
        <div className="text-[10px] text-muted mb-0.5">AI Match Score</div>
        <div className="text-lg font-bold font-display text-primary">94%</div>
      </motion.div>

      {/* Floating skill badge */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-4 -left-4 bg-surface border border-secondary/30 rounded-xl px-3 py-2 shadow-glow-violet"
      >
        <div className="text-[10px] text-muted mb-1">Skills Matched</div>
        <div className="flex gap-1">
          {['React', 'Node', 'AWS'].map((s) => (
            <span key={s} className="text-[9px] bg-secondary/20 text-purple-400 rounded px-1.5 py-0.5 border border-secondary/20">
              {s}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center mesh-bg overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid opacity-40" />

      {/* Radial vignette */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-background opacity-60" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: text content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-xl"
          >
            {/* Badge */}
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 border border-primary/30 text-primary mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-cyan" />
                AI-Powered Job Matching — Now in Beta
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="font-display text-5xl md:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight mb-6"
            >
              Find Your{' '}
              <span className="text-gradient-cyan block">Perfect Role</span>
              <span className="text-text/80">Effortlessly.</span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              variants={itemVariants}
              className="text-lg text-muted leading-relaxed mb-8"
            >
              Upload your resume and let our AI engine parse your skills, match you to thousands of curated roles, and surface the opportunities that actually fit — not just keyword noise.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-4 mb-12">
              <Link href="/register">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  }
                >
                  Upload Resume — Free
                </Button>
              </Link>
              <a href="#features">
                <Button variant="ghost" size="lg">
                  See how it works
                </Button>
              </a>
            </motion.div>

            {/* Social proof */}
            <motion.div variants={itemVariants} className="flex items-center gap-6">
              <div className="flex -space-x-2">
                {['#00d4ff', '#7c3aed', '#10b981', '#f59e0b'].map((color, i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-surface"
                    style={{ background: `${color}30`, borderColor: color + '40' }}
                  />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-text">2,400+ job seekers</p>
                <p className="text-xs text-muted">matched in the last 30 days</p>
              </div>
              <div className="h-8 w-px bg-border hidden sm:block" />
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-text">94% match accuracy</p>
                <p className="text-xs text-muted">vs. traditional search</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: dashboard preview */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block"
          >
            <DashboardPreview />
          </motion.div>
        </div>
      </div>

      {/* Floating pills */}
      <div className="hidden xl:block">
        {floatingPills.map((pill) => (
          <motion.div
            key={pill.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: pill.delay + 0.8, duration: 0.5 }}
            style={{ position: 'absolute', left: pill.x, top: pill.y }}
            className="bg-surface/70 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 text-xs font-medium text-muted pointer-events-none"
          >
            {pill.label}
          </motion.div>
        ))}
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
