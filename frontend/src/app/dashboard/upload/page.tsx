'use client'

import { useEffect, useState } from 'react'
import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { resumeApi } from '@/lib/api'
import { Resume } from '@/types'
import { deleteGuestResume, getGuestResumes, triggerGuestMatching } from '@/lib/guestData'
import { useUserStore } from '@/store/userStore'
import ResumeUpload from '@/components/resume/ResumeUpload'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'

export default function UploadPage() {
  const { isGuest } = useUserStore()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)

  const fetchResumes = useCallback(async () => {
    if (isGuest) {
      setResumes(getGuestResumes())
      setLoading(false)
      return
    }

    try {
      const response = await resumeApi.getMyResumes()
      setResumes(response.data.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [isGuest])

  useEffect(() => {
    fetchResumes()
  }, [fetchResumes])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return

    if (isGuest) {
      deleteGuestResume(id)
      setResumes((prev) => prev.filter((r) => r.id !== id))
      return
    }

    try {
      await resumeApi.deleteResume(id)
      setResumes((prev) => prev.filter((r) => r.id !== id))
    } catch {
      // silent
    }
  }

  const statusConfig: Record<Resume['processingStatus'], { label: string; color: 'success' | 'warning' | 'primary' | 'danger' }> = {
    completed: { label: 'Parsed', color: 'success' },
    processing: { label: 'Processing', color: 'warning' },
    pending: { label: 'Pending', color: 'primary' },
    failed: { label: 'Failed', color: 'danger' },
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-display text-3xl font-bold text-text mb-2">Upload Resume</h1>
        <p className="text-muted">
          Upload your resume and let our AI extract your skills, experience, and career highlights to power smarter job matching.
        </p>
      </motion.div>

      {/* Info cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            icon: '⚡',
            title: 'Instant Parsing',
            desc: 'Skills and experience extracted in seconds',
            color: 'border-primary/20 bg-primary/5',
          },
          {
            icon: '🎯',
            title: 'Smart Matching',
            desc: 'Powers personalized job recommendations',
            color: 'border-secondary/20 bg-secondary/5',
          },
          {
            icon: '🔒',
            title: 'Secure Storage',
            desc: 'Encrypted and never shared without consent',
            color: 'border-emerald-500/20 bg-emerald-500/5',
          },
        ].map((item) => (
          <div key={item.title} className={`rounded-xl border p-4 ${item.color}`}>
            <div className="text-xl mb-2">{item.icon}</div>
            <div className="text-sm font-semibold text-text mb-1">{item.title}</div>
            <div className="text-xs text-muted">{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Upload area */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <ResumeUpload guestMode={isGuest} onUploadComplete={() => fetchResumes()} />
      </motion.div>

      {/* Previous resumes */}
      {!loading && resumes.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-display text-lg font-bold text-text mb-4 flex items-center gap-2">
            Previous Resumes
            <Badge variant="muted" size="sm">{resumes.length}</Badge>
          </h2>

          <div className="space-y-3">
            {resumes.map((resume) => {
              const status = statusConfig[resume.processingStatus]
              return (
                <div
                  key={resume.id}
                  className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4"
                >
                  {/* File icon */}
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{resume.fileName}</p>
                    <p className="text-xs text-muted">
                      Uploaded {formatDate(resume.uploadedAt)}
                      {resume.parsedData?.skills?.length > 0 && (
                        <> · {resume.parsedData.skills.length} skills extracted</>
                      )}
                    </p>
                  </div>

                  {/* Status */}
                  <Badge variant={status.color} size="sm" dot>{status.label}</Badge>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {resume.processingStatus === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (isGuest) {
                            triggerGuestMatching(resume.id)
                            return
                          }
                          await resumeApi.triggerMatching(resume.id)
                        }}
                      >
                        Match Jobs
                      </Button>
                    )}
                    <button
                      onClick={() => handleDelete(resume.id)}
                      className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                      title="Delete resume"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      )}
    </div>
  )
}
