'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { JobMatch } from '@/types'
import {
  cn,
  formatSalary,
  formatDate,
  formatJobType,
  formatWorkEnvironment,
  getCompanyInitials,
  getMatchStrokeColor,
  getMatchColor,
} from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { jobsApi } from '@/lib/api'
import { useJobStore } from '@/store/jobStore'
import { useUserStore } from '@/store/userStore'

interface JobCardProps {
  job: JobMatch
  onApply?: (job: JobMatch) => void
}

// Circular progress ring
function MatchRing({
  score,
  size = 52,
}: {
  score: number
  size?: number
}) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference
  const strokeColor = getMatchStrokeColor(score)

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={4}
          fill="none"
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ filter: `drop-shadow(0 0 4px ${strokeColor}60)` }}
        />
      </svg>
      {/* Score text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('text-xs font-bold font-display', getMatchColor(score))}>
          {score}%
        </span>
      </div>
    </div>
  )
}

export default function JobCard({ job, onApply }: JobCardProps) {
  const { jobListing, matchScore, isSaved, isApplied } = job
  const { toggleSaveJob } = useJobStore()
  const { isGuest } = useUserStore()
  const [savingLoading, setSavingLoading] = useState(false)

  const maxSkillsShown = 3
  const visibleSkills = jobListing.requiredSkills.slice(0, maxSkillsShown)
  const remainingSkills = jobListing.requiredSkills.length - maxSkillsShown

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (savingLoading) return
    setSavingLoading(true)
    try {
      if (!isGuest) {
        if (isSaved) {
          await jobsApi.unsaveJob(job.id)
        } else {
          await jobsApi.saveJob(job.id)
        }
      }
      toggleSaveJob(job.id)
    } catch {
      // Handle error silently — optimistic update already applied
    } finally {
      setSavingLoading(false)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-surface border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:border-border-bright hover:shadow-card-hover hover:-translate-y-0.5 flex flex-col"
    >
      {/* Top section */}
      <div className="p-5 flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          {/* Company avatar + info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex-shrink-0 h-11 w-11 rounded-xl bg-gradient-to-br from-surface-3 to-surface-2 border border-border flex items-center justify-center text-sm font-bold text-text-secondary font-display">
              {getCompanyInitials(jobListing.company)}
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-text text-sm leading-tight truncate">
                {jobListing.title}
              </h3>
              <p className="text-xs text-muted truncate mt-0.5">{jobListing.company}</p>
            </div>
          </div>

          {/* Match ring */}
          <MatchRing score={matchScore} />
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {/* Location */}
          <span className="flex items-center gap-1 text-xs text-muted">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {jobListing.location}
          </span>

          <Badge variant="muted" size="sm">{formatWorkEnvironment(jobListing.workEnvironment)}</Badge>
          <Badge variant="default" size="sm">{formatJobType(jobListing.jobType)}</Badge>
        </div>

        {/* Salary */}
        <div className="flex items-center gap-1.5 mb-4">
          <svg className="w-3.5 h-3.5 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium text-text-secondary">
            {formatSalary(jobListing.salaryMin, jobListing.salaryMax, jobListing.currency)}
          </span>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5">
          {visibleSkills.map((skill) => (
            <Badge key={skill} variant="primary" size="sm">{skill}</Badge>
          ))}
          {remainingSkills > 0 && (
            <Badge variant="muted" size="sm">+{remainingSkills} more</Badge>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 pt-3 border-t border-border flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted">
          Posted {formatDate(jobListing.postedAt)}
        </span>

        <div className="flex items-center gap-2">
          {/* Save button */}
          <button
            onClick={handleToggleSave}
            disabled={savingLoading}
            className={cn(
              'p-2 rounded-lg transition-all duration-200',
              isSaved
                ? 'text-primary bg-primary/10 hover:bg-primary/20'
                : 'text-muted hover:text-text hover:bg-surface-2'
            )}
            aria-label={isSaved ? 'Unsave job' : 'Save job'}
          >
            <svg
              className="w-4 h-4"
              fill={isSaved ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>

          {isApplied ? (
            <Badge variant="success" size="sm" dot>Applied</Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApply?.(job)}
            >
              Apply
            </Button>
          )}
        </div>
      </div>

      {/* Hover overlay — "View Details" */}
      <AnimatePresence>
        {false && ( // Conditionally show on click/modal trigger
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-surface/95 backdrop-blur-sm rounded-2xl p-5 flex flex-col justify-between"
          >
            <p className="text-sm text-text-secondary leading-relaxed line-clamp-6">
              {jobListing.description}
            </p>
            <Button variant="primary" fullWidth size="sm">
              View Full Details
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
