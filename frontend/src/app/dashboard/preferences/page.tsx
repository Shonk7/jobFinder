'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import PreferencesForm from '@/components/preferences/PreferencesForm'

export default function PreferencesPage() {
  const router = useRouter()

  const handleComplete = () => {
    router.push('/dashboard')
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-display text-3xl font-bold text-text mb-2">Job Preferences</h1>
        <p className="text-muted">
          Tell us what you&apos;re looking for. The more specific you are, the better your matches will be.
        </p>
      </motion.div>

      {/* Why this matters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-border rounded-2xl p-5 mb-8 flex items-start gap-4"
      >
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-text text-sm mb-1">Why preferences matter</h3>
          <p className="text-xs text-muted leading-relaxed">
            Our AI uses your preferences alongside your resume to score every job. Precise preferences mean
            fewer irrelevant results and more &ldquo;why didn&apos;t I find this sooner&rdquo; moments.
            You can update them at any time — we re-rank your matches instantly.
          </p>
        </div>
      </motion.div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-surface border border-border rounded-2xl p-7"
      >
        <PreferencesForm onComplete={handleComplete} />
      </motion.div>
    </div>
  )
}
