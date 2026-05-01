'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import type { FileRejection } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { resumeApi } from '@/lib/api'
import { ParsedResumeData, Resume } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'done' | 'error'
  progress: number
  file: File | null
  resume: Resume | null
  parsedData: ParsedResumeData | null
  error: string | null
}

interface ResumeUploadProps {
  onUploadComplete?: (resume: Resume) => void
}

export default function ResumeUpload({ onUploadComplete }: ResumeUploadProps) {
  const [state, setState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    file: null,
    resume: null,
    parsedData: null,
    error: null,
  })

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        const err = rejectedFiles[0].errors[0]
        setState((s) => ({
          ...s,
          error:
            err.code === 'file-too-large'
              ? 'File is too large. Maximum size is 10MB.'
              : err.code === 'file-invalid-type'
              ? 'Invalid file type. Please upload a PDF, DOC, DOCX, or TXT file.'
              : err.message,
        }))
        return
      }

      const file = acceptedFiles[0]
      if (!file) return

      setState({ status: 'uploading', progress: 0, file, resume: null, parsedData: null, error: null })

      try {
        const response = await resumeApi.upload(file, (progress) => {
          setState((s) => ({ ...s, progress }))
        })

        const resume = response.data.data
        setState((s) => ({ ...s, status: 'processing', resume, progress: 100 }))

        // Poll for parsed data
        let attempts = 0
        const maxAttempts = 20
        const pollInterval = setInterval(async () => {
          attempts++
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval)
            setState((s) => ({
              ...s,
              status: 'error',
              error: 'Resume processing timed out. Please try again.',
            }))
            return
          }

          try {
            const parsedResponse = await resumeApi.getParsedData(resume.id)
            if (parsedResponse.data.data) {
              clearInterval(pollInterval)
              const parsedData = parsedResponse.data.data
              setState((s) => ({ ...s, status: 'done', parsedData }))
              onUploadComplete?.(resume)
            }
          } catch {
            // Still processing
          }
        }, 1500)
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to upload resume. Please try again.'
        setState((s) => ({
          ...s,
          status: 'error',
          error: errorMessage,
        }))
      }
    },
    [onUploadComplete]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: state.status === 'uploading' || state.status === 'processing',
  })

  const handleReset = () => {
    setState({ status: 'idle', progress: 0, file: null, resume: null, parsedData: null, error: null })
  }

  const handleTriggerMatching = async () => {
    if (!state.resume) return
    try {
      await resumeApi.triggerMatching(state.resume.id)
    } catch {
      // Handle silently
    }
  }

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <AnimatePresence mode="wait">
        {state.status === 'idle' || state.status === 'error' ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div
              {...getRootProps()}
              className={cn(
                'relative w-full border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer',
                'transition-all duration-300 group',
                isDragActive && !isDragReject
                  ? 'border-primary bg-primary/5 shadow-glow-cyan'
                  : isDragReject
                  ? 'border-danger bg-danger/5'
                  : 'border-border hover:border-primary/50 hover:bg-primary/3',
                'focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background'
              )}
            >
              <input {...getInputProps()} />

              {/* Background pattern */}
              <div className="absolute inset-0 bg-dot-pattern opacity-20 rounded-2xl pointer-events-none" />

              <div className="relative z-10">
                {/* Upload icon */}
                <motion.div
                  animate={isDragActive ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className={cn(
                    'mx-auto mb-5 h-20 w-20 rounded-2xl flex items-center justify-center',
                    'transition-all duration-300',
                    isDragActive
                      ? 'bg-primary/20 text-primary'
                      : 'bg-surface-2 text-muted group-hover:bg-primary/10 group-hover:text-primary'
                  )}
                >
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </motion.div>

                <h3 className="font-display text-xl font-bold text-text mb-2">
                  {isDragActive
                    ? isDragReject
                      ? 'Invalid file type'
                      : 'Drop your resume here'
                    : 'Upload your resume'}
                </h3>
                <p className="text-muted text-sm mb-4">
                  Drag & drop or{' '}
                  <span className="text-primary font-medium">browse files</span>
                </p>

                {/* Supported formats */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {['PDF', 'DOC', 'DOCX', 'TXT'].map((ext) => (
                    <Badge key={ext} variant="muted" size="sm">{ext}</Badge>
                  ))}
                  <span className="text-xs text-muted">Max 10MB</span>
                </div>

                {state.error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-4 py-2"
                  >
                    {state.error}
                  </motion.p>
                )}
              </div>
            </div>
          </motion.div>
        ) : state.status === 'uploading' ? (
          <motion.div
            key="uploading"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-surface border border-border rounded-2xl p-8 text-center"
          >
            <div className="mb-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 text-primary mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-text font-medium mb-1">{state.file?.name}</p>
              <p className="text-muted text-sm mb-6">
                {(((state.file?.size || 0) / 1024) / 1024).toFixed(1)} MB
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-surface-2 rounded-full h-2 mb-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${state.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted">
              <span>Uploading...</span>
              <span>{state.progress}%</span>
            </div>
          </motion.div>
        ) : state.status === 'processing' ? (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-surface border border-border rounded-2xl p-8 text-center"
          >
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-secondary/10 text-purple-400 mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </motion.div>
            </div>
            <h3 className="font-display text-lg font-bold text-text mb-2">Analyzing your resume</h3>
            <p className="text-muted text-sm">
              Our AI is extracting your skills, experience, and education...
            </p>
            <div className="mt-6 flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
                />
              ))}
            </div>
          </motion.div>
        ) : state.status === 'done' && state.parsedData ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Success banner */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-emerald-400 text-sm">Resume analyzed successfully!</p>
                <p className="text-xs text-muted mt-0.5">{state.file?.name}</p>
              </div>
              <button onClick={handleReset} className="ml-auto text-muted hover:text-text transition-colors p-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Parsed data summary */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Skills */}
              <div className="bg-surface border border-border rounded-2xl p-5">
                <h4 className="font-display font-bold text-text text-sm mb-3 flex items-center gap-2">
                  <span className="h-5 w-5 rounded-md bg-primary/20 text-primary flex items-center justify-center text-[10px]">
                    S
                  </span>
                  Extracted Skills
                  <Badge variant="primary" size="sm">{state.parsedData.skills.length}</Badge>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {state.parsedData.skills.slice(0, 15).map((skill) => (
                    <Badge key={skill} variant="primary" size="sm">{skill}</Badge>
                  ))}
                  {state.parsedData.skills.length > 15 && (
                    <Badge variant="muted" size="sm">+{state.parsedData.skills.length - 15} more</Badge>
                  )}
                </div>
              </div>

              {/* Experience */}
              <div className="bg-surface border border-border rounded-2xl p-5">
                <h4 className="font-display font-bold text-text text-sm mb-3 flex items-center gap-2">
                  <span className="h-5 w-5 rounded-md bg-secondary/20 text-purple-400 flex items-center justify-center text-[10px]">
                    E
                  </span>
                  Career Summary
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted">Experience</span>
                    <span className="font-semibold text-text">{state.parsedData.yearsOfExperience} years</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted">Education</span>
                    <span className="font-semibold text-text capitalize">{state.parsedData.educationLevel}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted">Positions</span>
                    <span className="font-semibold text-text">{state.parsedData.workExperience.length} roles</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                onClick={handleTriggerMatching}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              >
                Find Matching Jobs
              </Button>
              <Button variant="ghost" onClick={handleReset}>
                Upload Different Resume
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
