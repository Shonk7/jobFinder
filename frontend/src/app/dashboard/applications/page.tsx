'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Application, ApplicationStatus } from '@/types'
import { applicationsApi } from '@/lib/api'
import { getGuestApplications } from '@/lib/guestData'
import { useUserStore } from '@/store/userStore'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate, getCompanyInitials } from '@/lib/utils'

type Column = {
  id: ApplicationStatus
  label: string
  color: string
  borderColor: string
  bgColor: string
  dotColor: string
}

const COLUMNS: Column[] = [
  {
    id: ApplicationStatus.APPLIED,
    label: 'Applied',
    color: 'text-primary',
    borderColor: 'border-primary/20',
    bgColor: 'bg-primary/5',
    dotColor: 'bg-primary',
  },
  {
    id: ApplicationStatus.SCREENING,
    label: 'Screening',
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500/20',
    bgColor: 'bg-yellow-500/5',
    dotColor: 'bg-yellow-400',
  },
  {
    id: ApplicationStatus.INTERVIEW,
    label: 'Interview',
    color: 'text-purple-400',
    borderColor: 'border-secondary/20',
    bgColor: 'bg-secondary/5',
    dotColor: 'bg-purple-400',
  },
  {
    id: ApplicationStatus.OFFER,
    label: 'Offer',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
    bgColor: 'bg-emerald-500/5',
    dotColor: 'bg-emerald-400',
  },
  {
    id: ApplicationStatus.REJECTED,
    label: 'Rejected',
    color: 'text-red-400',
    borderColor: 'border-red-500/20',
    bgColor: 'bg-red-500/5',
    dotColor: 'bg-red-400',
  },
]

function ApplicationCard({ application }: { application: Application }) {
  const { jobListing } = application
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border rounded-xl p-4 hover:border-border-bright hover:shadow-card transition-all duration-200 cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-surface-3 to-surface-2 border border-border flex items-center justify-center text-xs font-bold text-text-secondary flex-shrink-0">
          {getCompanyInitials(jobListing.company)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-text truncate">{jobListing.title}</h4>
          <p className="text-xs text-muted truncate">{jobListing.company}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <span className="text-xs text-muted">{jobListing.location}</span>
        {jobListing.workEnvironment && (
          <Badge variant="muted" size="sm">{jobListing.workEnvironment}</Badge>
        )}
      </div>

      {/* Date */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted">
          Applied {formatDate(application.appliedAt)}
        </span>
        {application.interviewDate && (
          <span className="text-[11px] text-purple-400 font-medium">
            Interview: {formatDate(application.interviewDate)}
          </span>
        )}
      </div>

      {/* Notes preview */}
      {application.notes && (
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-[11px] text-muted italic line-clamp-1">{application.notes}</p>
        </div>
      )}
    </motion.div>
  )
}

function EmptyColumn({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="h-10 w-10 rounded-xl bg-surface-2 flex items-center justify-center mb-3">
        <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <p className="text-xs text-muted">No {label.toLowerCase()} applications</p>
    </div>
  )
}

export default function ApplicationsPage() {
  const { isGuest } = useUserStore()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchApplications = async () => {
      if (isGuest) {
        setApplications(getGuestApplications())
        setLoading(false)
        return
      }

      try {
        const response = await applicationsApi.getAll()
        setApplications(response.data.data)
      } catch {
        setError('Failed to load applications.')
        // Use empty state
        setApplications([])
      } finally {
        setLoading(false)
      }
    }
    fetchApplications()
  }, [isGuest])

  const getColumnApplications = (status: ApplicationStatus) =>
    applications.filter((app) => app.status === status)

  const totalActive = applications.filter(
    (a) => a.status !== ApplicationStatus.REJECTED && a.status !== ApplicationStatus.WITHDRAWN
  ).length

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between mb-8"
      >
        <div>
          <h1 className="font-display text-3xl font-bold text-text mb-2">Applications</h1>
          <p className="text-muted">
            Track your job applications through the hiring pipeline.
            {!loading && (
              <> <span className="text-primary font-medium">{totalActive} active</span> · {applications.length} total</>
            )}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => window.location.href = '/dashboard'}
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Browse Jobs
        </Button>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-5 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.id} className="space-y-3">
              <div className="skeleton h-8 rounded-lg" />
              {[1, 2].map((i) => (
                <div key={i} className="skeleton h-28 rounded-xl" />
              ))}
            </div>
          ))}
        </div>
      ) : error && applications.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-text font-medium mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : applications.length === 0 ? (
        // Empty state
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-surface-2 text-muted mb-5 mx-auto">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h3 className="font-display text-xl font-bold text-text mb-2">No applications yet</h3>
          <p className="text-muted text-sm mb-6 max-w-xs mx-auto">
            Start applying to your matched jobs and track your progress here.
          </p>
          <Button variant="primary" onClick={() => window.location.href = '/dashboard'}>
            Find Jobs to Apply
          </Button>
        </motion.div>
      ) : (
        /* Kanban board */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colApps = getColumnApplications(col.id)
            return (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: COLUMNS.indexOf(col) * 0.06 }}
                className={`rounded-2xl border ${col.borderColor} ${col.bgColor} p-3 min-h-[400px] flex flex-col`}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${col.dotColor}`} />
                    <span className={`font-display font-bold text-sm ${col.color}`}>{col.label}</span>
                  </div>
                  {colApps.length > 0 && (
                    <span className="text-xs font-bold text-muted bg-surface/80 rounded-full h-5 w-5 flex items-center justify-center">
                      {colApps.length}
                    </span>
                  )}
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-2.5">
                  {colApps.length === 0 ? (
                    <EmptyColumn label={col.label} />
                  ) : (
                    colApps.map((app) => (
                      <ApplicationCard key={app.id} application={app} />
                    ))
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
