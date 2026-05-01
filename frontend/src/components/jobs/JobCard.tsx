'use client'

import { useState } from 'react'
import { Job } from '@/types'
import { cn } from '@/lib/utils'

const APPLIED_KEY = 'jf_applied_v2'

function getApplied(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try { return new Set<string>(JSON.parse(localStorage.getItem(APPLIED_KEY) || '[]')) }
  catch { return new Set() }
}

function markApplied(id: string) {
  const s = getApplied(); s.add(id)
  localStorage.setItem(APPLIED_KEY, JSON.stringify(Array.from(s)))
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '??'
}

function fmtSalary(min: number | null, max: number | null, cur: string) {
  if (!min && !max) return null
  const sym = cur === 'USD' ? '$' : cur === 'EUR' ? '€' : cur === 'GBP' ? '£' : '$'
  const k = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}k` : String(n)
  if (min && max && min !== max) return `${sym}${k(min)}–${sym}${k(max)}`
  return `${sym}${k(min || max || 0)}`
}

function fmtDate(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return '1d ago'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

const SOURCE_COLOUR: Record<string, string> = {
  jora: '#00d4ff',
  remotive: '#7c3aed',
  remoteok: '#10b981',
  arbeitnow: '#f59e0b',
}

const TYPE_LABEL: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  freelance: 'Freelance',
}

const EXP_LABEL: Record<string, string> = {
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
}

interface Props {
  job: Job
  matchScore?: number
}

function matchBadgeStyle(score: number): { label: string; cls: string } {
  if (score >= 80) return { label: `${score}% match`, cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' }
  if (score >= 60) return { label: `${score}% match`, cls: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' }
  if (score >= 40) return { label: `${score}% match`, cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20' }
  return { label: `${score}% match`, cls: 'text-muted bg-surface-2 border-border' }
}

export default function JobCard({ job, matchScore }: Props) {
  const [applied, setApplied] = useState(() => getApplied().has(job.id))
  const [expanded, setExpanded] = useState(false)

  const salary = fmtSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)
  const sourceColor = SOURCE_COLOUR[job.source] ?? '#64748b'
  const skills = job.skills.slice(0, 5)
  const extraSkills = job.skills.length - 5

  function handleApply(e: React.MouseEvent) {
    e.stopPropagation()
    if (job.url) {
      window.open(job.url, '_blank', 'noopener,noreferrer')
    }
    markApplied(job.id)
    setApplied(true)
  }

  return (
    <div
      onClick={() => setExpanded(v => !v)}
      className={cn(
        'group relative bg-surface border rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer flex flex-col',
        expanded ? 'border-border-bright' : 'border-border hover:border-border-bright hover:-translate-y-0.5 hover:shadow-card-hover'
      )}
    >
      {/* Source indicator strip */}
      <div className="h-0.5 w-full" style={{ background: sourceColor }} />

      <div className="p-4 flex-1">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold text-background"
            style={{ background: `linear-gradient(135deg, ${sourceColor}cc, ${sourceColor}66)` }}
          >
            {initials(job.company)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-bold text-text text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            <p className="text-xs text-muted mt-0.5 truncate">{job.company}</p>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            {applied && (
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                Applied
              </span>
            )}
            {matchScore !== undefined && matchScore > 0 && (() => {
              const { label, cls } = matchBadgeStyle(matchScore)
              return (
                <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full ${cls}`}>
                  {label}
                </span>
              )
            })()}
          </div>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="flex items-center gap-1 text-[11px] text-muted">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {job.location}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-text-secondary">
            {TYPE_LABEL[job.jobType] ?? job.jobType}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-text-secondary">
            {EXP_LABEL[job.experienceLevel] ?? job.experienceLevel}
          </span>
        </div>

        {/* Salary */}
        {salary && (
          <p className="text-xs font-semibold text-text mb-3">
            {salary} <span className="text-muted font-normal">{job.salaryCurrency}</span>
          </p>
        )}

        {/* Skills */}
        <div className="flex flex-wrap gap-1">
          {skills.map(s => (
            <span
              key={s}
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: sourceColor + '18', color: sourceColor, border: `1px solid ${sourceColor}30` }}
            >
              {s}
            </span>
          ))}
          {extraSkills > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-3 text-muted border border-border">
              +{extraSkills}
            </span>
          )}
        </div>

        {/* Description (expanded) */}
        {expanded && job.description && (
          <p className="mt-3 pt-3 border-t border-border text-xs text-muted leading-relaxed line-clamp-6">
            {job.description}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 pt-2 border-t border-border flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted">{fmtDate(job.postedDate)}</span>
        <button
          onClick={handleApply}
          disabled={!job.url}
          className={cn(
            'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150',
            applied
              ? 'text-emerald-400 bg-emerald-400/10 cursor-default'
              : job.url
              ? 'text-background hover:opacity-90 active:scale-95'
              : 'text-muted bg-surface-2 cursor-not-allowed'
          )}
          style={applied || !job.url ? {} : { background: sourceColor }}
        >
          {applied ? (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Applied
            </>
          ) : (
            <>
              Apply
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
