'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '@/store/userStore'
import { useJobStore } from '@/store/jobStore'
import { jobsApi, dashboardApi } from '@/lib/api'
import { DashboardStats, JobMatch } from '@/types'
import { addGuestApplicationFromJob, getGuestJobMatches, getGuestStats } from '@/lib/guestData'
import JobCard from '@/components/jobs/JobCard'
import JobFilters from '@/components/jobs/JobFilters'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

function StatCard({
  label,
  value,
  icon,
  color,
  suffix,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  color: string
  suffix?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-4"
    >
      <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        {icon}
      </div>
      <div>
        <div className="font-display text-2xl font-bold text-text leading-none mb-1">
          {value}{suffix}
        </div>
        <div className="text-xs text-muted">{label}</div>
      </div>
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="skeleton h-11 w-11 rounded-xl" />
          <div className="space-y-2">
            <div className="skeleton h-3 w-28" />
            <div className="skeleton h-2.5 w-20" />
          </div>
        </div>
        <div className="skeleton h-12 w-12 rounded-full" />
      </div>
      <div className="flex gap-2">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-14 rounded-full" />
        <div className="skeleton h-5 w-20 rounded-full" />
      </div>
      <div className="flex gap-1.5">
        <div className="skeleton h-5 w-12 rounded-full" />
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-10 rounded-full" />
      </div>
      <div className="skeleton h-px w-full" />
      <div className="flex justify-between">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-7 w-16 rounded-lg" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, isGuest } = useUserStore()
  const { jobs, filters, pagination, setJobs, appendJobs, setLoading, isLoading, error, setError } = useJobStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const fetchJobs = useCallback(async (reset = true) => {
    if (reset) setLoading(true)
    setError(null)

    if (isGuest) {
      const localJobs = getGuestJobMatches()
      setJobs(localJobs, {
        page: 1,
        limit: localJobs.length,
        total: localJobs.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      })
      setLoading(false)
      setLoadingMore(false)
      return
    }

    try {
      const response = await jobsApi.getMatches({ ...filters, page: reset ? 1 : (pagination.page + 1) })
      const { data, pagination: pag } = response.data
      if (reset) {
        setJobs(data, pag)
      } else {
        appendJobs(data, pag)
      }
    } catch {
      setError('Failed to load job matches. Please try again.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filters, pagination.page, setLoading, setError, setJobs, appendJobs, isGuest])

  useEffect(() => {
    fetchJobs(true)
  }, [filters]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchStats = async () => {
      if (isGuest) {
        setStats(getGuestStats())
        setStatsLoading(false)
        return
      }

      try {
        const response = await dashboardApi.getStats()
        setStats(response.data.data)
      } catch {
        // Use placeholder stats
        setStats({
          matchesFound: 47,
          applicationsSent: 12,
          profileStrength: 78,
          savedJobs: 8,
          interviewsScheduled: 2,
        })
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [isGuest])

  const handleApply = (job: JobMatch) => {
    if (isGuest) {
      addGuestApplicationFromJob(job)
    }
  }

  const handleLoadMore = () => {
    if (loadingMore || !pagination.hasNext) return
    setLoadingMore(true)
    fetchJobs(false)
  }

  // Mock data for initial load
  const displayJobs: JobMatch[] = jobs.length > 0 ? jobs : []

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-display text-3xl font-bold text-text">
          {greeting()},{' '}
          <span className="text-gradient-cyan">{user?.firstName || 'there'}</span>
        </h1>
        <p className="text-muted mt-1">
          Here are your latest job matches — updated daily.
        </p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              label="New matches"
              value={stats?.matchesFound || 0}
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              color="bg-primary/10 text-primary"
            />
            <StatCard
              label="Applications sent"
              value={stats?.applicationsSent || 0}
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              color="bg-secondary/10 text-purple-400"
            />
            <StatCard
              label="Profile strength"
              value={stats?.profileStrength || 0}
              suffix="%"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              color="bg-emerald-500/10 text-emerald-400"
            />
            <StatCard
              label="Saved jobs"
              value={stats?.savedJobs || 0}
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              }
              color="bg-yellow-500/10 text-yellow-400"
            />
          </>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6">
        <JobFilters />
      </div>

      {/* Jobs grid */}
      <div>
        {error ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-danger/10 text-danger mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-text font-medium mb-2">{error}</p>
            <Button variant="outline" onClick={() => fetchJobs(true)}>Try again</Button>
          </div>
        ) : isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : displayJobs.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-surface-2 text-muted mb-5 mx-auto">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="font-display text-xl font-bold text-text mb-2">No matches yet</h3>
            <p className="text-muted text-sm mb-6 max-w-xs mx-auto">
              Upload your resume and set your preferences to start getting personalized job matches.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="primary" onClick={() => window.location.href = '/dashboard/upload'}>
                Upload Resume
              </Button>
              <Button variant="ghost" onClick={() => window.location.href = '/dashboard/preferences'}>
                Set Preferences
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted">
                Showing <span className="text-text font-medium">{displayJobs.length}</span> of{' '}
                <span className="text-text font-medium">{pagination.total || displayJobs.length}</span> matches
              </p>
              <Button variant="ghost" size="sm" onClick={() => fetchJobs(true)}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayJobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.4 }}
                >
                  <JobCard job={job} onApply={handleApply} />
                </motion.div>
              ))}
            </div>

            {pagination.hasNext && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleLoadMore}
                  loading={loadingMore}
                >
                  Load more matches
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
