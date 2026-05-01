'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { JobFilters as Filters, JobType, WorkEnvironment } from '@/types'
import { useJobStore } from '@/store/jobStore'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn, formatJobType, formatWorkEnvironment } from '@/lib/utils'

const jobTypeOptions: { value: JobType; label: string }[] = [
  { value: JobType.FULL_TIME, label: 'Full-time' },
  { value: JobType.PART_TIME, label: 'Part-time' },
  { value: JobType.CONTRACT, label: 'Contract' },
  { value: JobType.FREELANCE, label: 'Freelance' },
  { value: JobType.INTERNSHIP, label: 'Internship' },
]

const workEnvOptions: { value: WorkEnvironment; label: string }[] = [
  { value: WorkEnvironment.REMOTE, label: 'Remote' },
  { value: WorkEnvironment.HYBRID, label: 'Hybrid' },
  { value: WorkEnvironment.ONSITE, label: 'On-site' },
]

const salaryRanges = [
  { label: 'Any', min: undefined, max: undefined },
  { label: '$40k+', min: 40000, max: undefined },
  { label: '$80k+', min: 80000, max: undefined },
  { label: '$120k+', min: 120000, max: undefined },
  { label: '$160k+', min: 160000, max: undefined },
  { label: '$200k+', min: 200000, max: undefined },
]

export default function JobFilters() {
  const { filters, setFilters, clearFilters } = useJobStore()
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const activeFilterCount = [
    filters.jobType?.length,
    filters.workEnvironment?.length,
    filters.salaryMin ? 1 : 0,
    filters.search ? 1 : 0,
  ].filter(Boolean).reduce<number>((acc, val) => acc + (Number(val) || 0), 0)

  const toggleJobType = (type: JobType) => {
    const current = filters.jobType || []
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type]
    setFilters({ jobType: updated.length ? updated : undefined })
  }

  const toggleWorkEnv = (env: WorkEnvironment) => {
    const current = filters.workEnvironment || []
    const updated = current.includes(env)
      ? current.filter((e) => e !== env)
      : [...current, env]
    setFilters({ workEnvironment: updated.length ? updated : undefined })
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      {/* Top bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-48">
          <Input
            placeholder="Search jobs, companies..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ search: e.target.value || undefined })}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Job Type */}
          <div className="relative">
            <button
              onClick={() => setExpandedSection(expandedSection === 'jobType' ? null : 'jobType')}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200',
                filters.jobType?.length
                  ? 'border-primary/40 text-primary bg-primary/5'
                  : 'border-border text-muted hover:text-text hover:border-border-bright'
              )}
            >
              Job Type
              {filters.jobType?.length ? (
                <span className="h-4 w-4 rounded-full bg-primary text-background text-[9px] font-bold flex items-center justify-center">
                  {filters.jobType.length}
                </span>
              ) : (
                <svg className={cn('w-3.5 h-3.5 transition-transform', expandedSection === 'jobType' && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            <AnimatePresence>
              {expandedSection === 'jobType' && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-48 bg-surface-2 border border-border rounded-xl shadow-card p-2 z-20"
                >
                  {jobTypeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => toggleJobType(opt.value)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                        filters.jobType?.includes(opt.value)
                          ? 'text-primary bg-primary/10'
                          : 'text-muted hover:text-text hover:bg-surface-3'
                      )}
                    >
                      <div className={cn(
                        'h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center',
                        filters.jobType?.includes(opt.value)
                          ? 'border-primary bg-primary'
                          : 'border-border'
                      )}>
                        {filters.jobType?.includes(opt.value) && (
                          <svg className="w-2.5 h-2.5 text-background" fill="none" viewBox="0 0 10 10">
                            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Work Environment */}
          <div className="relative">
            <button
              onClick={() => setExpandedSection(expandedSection === 'workEnv' ? null : 'workEnv')}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200',
                filters.workEnvironment?.length
                  ? 'border-primary/40 text-primary bg-primary/5'
                  : 'border-border text-muted hover:text-text hover:border-border-bright'
              )}
            >
              Location Type
              {filters.workEnvironment?.length ? (
                <span className="h-4 w-4 rounded-full bg-primary text-background text-[9px] font-bold flex items-center justify-center">
                  {filters.workEnvironment.length}
                </span>
              ) : (
                <svg className={cn('w-3.5 h-3.5 transition-transform', expandedSection === 'workEnv' && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            <AnimatePresence>
              {expandedSection === 'workEnv' && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-40 bg-surface-2 border border-border rounded-xl shadow-card p-2 z-20"
                >
                  {workEnvOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => toggleWorkEnv(opt.value)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                        filters.workEnvironment?.includes(opt.value)
                          ? 'text-primary bg-primary/10'
                          : 'text-muted hover:text-text hover:bg-surface-3'
                      )}
                    >
                      <div className={cn(
                        'h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center',
                        filters.workEnvironment?.includes(opt.value)
                          ? 'border-primary bg-primary'
                          : 'border-border'
                      )}>
                        {filters.workEnvironment?.includes(opt.value) && (
                          <svg className="w-2.5 h-2.5 text-background" fill="none" viewBox="0 0 10 10">
                            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Salary */}
          <div className="relative">
            <button
              onClick={() => setExpandedSection(expandedSection === 'salary' ? null : 'salary')}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200',
                filters.salaryMin
                  ? 'border-primary/40 text-primary bg-primary/5'
                  : 'border-border text-muted hover:text-text hover:border-border-bright'
              )}
            >
              Salary
              <svg className={cn('w-3.5 h-3.5 transition-transform', expandedSection === 'salary' && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence>
              {expandedSection === 'salary' && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-40 bg-surface-2 border border-border rounded-xl shadow-card p-2 z-20"
                >
                  {salaryRanges.map((range) => (
                    <button
                      key={range.label}
                      onClick={() => {
                        setFilters({ salaryMin: range.min, salaryMax: range.max })
                        setExpandedSection(null)
                      }}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg text-sm transition-colors text-left',
                        filters.salaryMin === range.min
                          ? 'text-primary bg-primary/10'
                          : 'text-muted hover:text-text hover:bg-surface-3'
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
            >
              Clear ({activeFilterCount})
            </Button>
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
          {filters.jobType?.map((type) => (
            <Badge
              key={type}
              variant="primary"
              size="sm"
              removable
              onRemove={() => toggleJobType(type)}
            >
              {formatJobType(type)}
            </Badge>
          ))}
          {filters.workEnvironment?.map((env) => (
            <Badge
              key={env}
              variant="primary"
              size="sm"
              removable
              onRemove={() => toggleWorkEnv(env)}
            >
              {formatWorkEnvironment(env)}
            </Badge>
          ))}
          {filters.salaryMin && (
            <Badge
              variant="primary"
              size="sm"
              removable
              onRemove={() => setFilters({ salaryMin: undefined, salaryMax: undefined })}
            >
              ${(filters.salaryMin / 1000).toFixed(0)}k+
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
