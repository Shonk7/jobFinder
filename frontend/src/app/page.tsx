'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { jobsApi, scraperApi } from '@/lib/api'
import { Job, JobFilters } from '@/types'
import JobCard from '@/components/jobs/JobCard'
import { cn } from '@/lib/utils'

// ─── Resume skill matching ─────────────────────────────────────────────────
const SKILL_TERMS = [
  'javascript','typescript','python','java','kotlin','swift','go','golang','rust',
  'c++','c#','ruby','php','scala','bash','shell','sql','html','css',
  'react','vue','angular','next.js','nextjs','nuxt','svelte','tailwind','sass','scss',
  'webpack','vite','redux','graphql','rest','restful',
  'node.js','nodejs','express','fastapi','django','flask','spring','rails','laravel',
  'postgresql','postgres','mysql','mongodb','redis','elasticsearch','dynamodb',
  'sqlite','cassandra','firebase','supabase','prisma',
  'aws','azure','gcp','docker','kubernetes','k8s','terraform','ansible','linux','nginx',
  'machine learning','deep learning','pytorch','tensorflow','scikit-learn',
  'pandas','numpy','spark','airflow','dbt','tableau','power bi',
  'git','agile','scrum','figma','microservices','ci/cd','jenkins',
  'jest','pytest','cypress','selenium','testing','jira',
  'ios','android','react native','flutter','mobile',
  'data science','data engineering','analytics','bi','etl',
  'java','c++','kotlin','objective-c','xamarin',
  'kafka','rabbitmq','celery','grpc','graphql',
  'solidity','blockchain','web3','smart contracts',
  'devops','sre','reliability','observability','prometheus','grafana','datadog',
  'security','penetration testing','cybersecurity','soc',
  'product management','roadmap','stakeholder',
  'ui','ux','design','figma','sketch','adobe',
]

const RESUME_KEY = 'jf_resume_v1'

function extractSkills(text: string): Set<string> {
  const lower = text.toLowerCase()
  return new Set(SKILL_TERMS.filter(t => lower.includes(t)))
}

function computeMatchScore(resumeSkills: Set<string>, jobSkills: string[]): number {
  if (!resumeSkills.size || !jobSkills.length) return 0
  const matches = jobSkills.filter(s => resumeSkills.has(s.toLowerCase())).length
  return Math.round((matches / jobSkills.length) * 100)
}

// ─── PDF text extraction ───────────────────────────────────────────────────
async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map((it) => ('str' in it ? it.str : '')).join(' '))
  }
  return pages.join('\n')
}

// ─── Resume Panel ──────────────────────────────────────────────────────────
function ResumePanel({ text, onChange }: { text: string; onChange: (v: string) => void }) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const skills = useMemo(() => extractSkills(text), [text])
  const count = skills.size

  async function processFile(file: File) {
    setUploadError(null)
    setUploading(true)
    setFileName(file.name)
    try {
      let extracted = ''
      if (file.name.toLowerCase().endsWith('.pdf')) {
        extracted = await extractTextFromPDF(file)
      } else {
        extracted = await file.text()
      }
      onChange(extracted)
    } catch {
      setUploadError('Could not read file — try a .pdf or .txt')
      setFileName(null)
    } finally {
      setUploading(false)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full right-0 mt-2 w-80 bg-surface-2 border border-border rounded-2xl shadow-card overflow-hidden z-50"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
        <span className="text-xs font-semibold text-secondary uppercase tracking-widest">Resume match</span>
        {count > 0 && (
          <span className="ml-auto text-[10px] text-muted">{count} skills detected</span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          className={cn(
            'rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all',
            dragging
              ? 'border-secondary bg-secondary/5'
              : 'border-border hover:border-secondary/50 hover:bg-surface-3/50'
          )}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-5 h-5 text-secondary animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-xs text-muted">Parsing PDF…</p>
            </div>
          ) : fileName && !uploadError ? (
            <div className="flex flex-col items-center gap-1">
              <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-medium text-text truncate max-w-[180px]">{fileName}</p>
              <p className="text-[10px] text-muted">Click to replace</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <div>
                <p className="text-xs text-muted">Drop your resume or <span className="text-secondary font-medium">browse</span></p>
                <p className="text-[10px] text-muted/60 mt-0.5">PDF or TXT</p>
              </div>
            </div>
          )}
        </div>

        {uploadError && (
          <p className="text-[11px] text-danger">{uploadError}</p>
        )}

        {/* Detected skills */}
        {count > 0 && (
          <div>
            <p className="text-[10px] text-muted mb-1.5">{count} skills detected</p>
            <div className="flex flex-wrap gap-1">
              {Array.from(skills).slice(0, 15).map(s => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                  {s}
                </span>
              ))}
              {count > 15 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-3 text-muted border border-border">
                  +{count - 15} more
                </span>
              )}
            </div>
          </div>
        )}

        {text && (
          <button
            onClick={() => { onChange(''); setFileName(null); setUploadError(null) }}
            className="text-[11px] text-muted hover:text-danger transition-colors"
          >
            Clear resume
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ─── Scrape Panel ──────────────────────────────────────────────────────────
type ScrapeState = 'idle' | 'running' | 'done' | 'error'

function ScrapePanel({ onDone }: { onDone: () => void }) {
  const [state, setState] = useState<ScrapeState>('idle')
  const [source, setSource] = useState('all')
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<{ created: number; updated: number; totalActive: number | null } | null>(null)

  async function run() {
    setState('running')
    setResult(null)
    try {
      const r = await scraperApi.run({ source, query: query || undefined, limit: 100 })
      setResult(r.data.data)
      setState('done')
      onDone()
    } catch {
      setState('error')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full right-0 mt-2 w-80 bg-surface-2 border border-border rounded-2xl shadow-card overflow-hidden z-50"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-cyan" />
        <span className="text-xs font-semibold text-primary uppercase tracking-widest">Scrape jobs</span>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <label className="text-[11px] text-muted mb-1 block">Source</label>
          <select
            value={source}
            onChange={e => setSource(e.target.value)}
            disabled={state === 'running'}
            className="input-base py-2 text-xs w-full"
          >
            <option value="all">All (Jora + Remotive + RemoteOK)</option>
            <option value="jora">Jora AU (Sydney jobs)</option>
            <option value="remotive">Remotive (remote/AU)</option>
            <option value="remoteok">RemoteOK (remote/AU)</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] text-muted mb-1 block">Keyword (optional)</label>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && state !== 'running' && run()}
            placeholder="react, python, devops…"
            disabled={state === 'running'}
            className="input-base py-2 text-xs w-full"
          />
        </div>

        <button
          onClick={run}
          disabled={state === 'running'}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all',
            state === 'running'
              ? 'bg-primary/10 text-primary cursor-wait'
              : 'bg-primary text-background hover:opacity-90 active:scale-95'
          )}
        >
          {state === 'running' ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Scraping… (up to 60s)
            </>
          ) : 'Fetch Jobs'}
        </button>

        <AnimatePresence>
          {state === 'done' && result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted space-y-0.5">
              <p><span className="text-emerald-400 font-semibold">{result.created} new</span> jobs added</p>
              <p><span className="text-text-secondary font-semibold">{result.updated}</span> updated</p>
              {result.totalActive != null && <p>{result.totalActive} total in DB</p>}
            </motion.div>
          )}
          {state === 'error' && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-danger">
              Failed — is the backend running on port 5001?
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ─── Filter bar ────────────────────────────────────────────────────────────
const JOB_TYPES = [
  { value: '', label: 'All types' },
  { value: 'full_time', label: 'Full-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'internship', label: 'Internship' },
]

const EXP_LEVELS = [
  { value: '', label: 'All levels' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
]

const SALARY_OPTS = [
  { value: 0, label: 'Any salary' },
  { value: 80_000, label: '$80k+' },
  { value: 100_000, label: '$100k+' },
  { value: 130_000, label: '$130k+' },
  { value: 160_000, label: '$160k+' },
]

// ─── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [jobType, setJobType] = useState('')
  const [expLevel, setExpLevel] = useState('')
  const [salaryMin, setSalaryMin] = useState(0)
  const [sortByMatch, setSortByMatch] = useState(false)

  const [showScraper, setShowScraper] = useState(false)
  const [showResume, setShowResume] = useState(false)
  const [resumeText, setResumeText] = useState(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem(RESUME_KEY) || ''
  })

  const scrapeRef = useRef<HTMLDivElement>(null)
  const resumeRef = useRef<HTMLDivElement>(null)

  const resumeSkills = useMemo(() => extractSkills(resumeText), [resumeText])
  const hasResume = resumeText.trim().length > 0

  function handleResumeChange(text: string) {
    setResumeText(text)
    localStorage.setItem(RESUME_KEY, text)
  }

  const buildFilters = useCallback((p = 1): JobFilters => ({
    search: search || undefined,
    jobType: jobType || undefined,
    experienceLevel: expLevel || undefined,
    salaryMin: salaryMin || undefined,
    page: p,
    limit: 24,
  }), [search, jobType, expLevel, salaryMin])

  const fetchJobs = useCallback(async (reset = true) => {
    if (reset) { setLoading(true); setPage(1) }
    setError(null)
    try {
      const r = await jobsApi.search(buildFilters(reset ? 1 : page))
      const { jobs: fetched, pagination } = r.data.data
      if (reset) {
        setJobs(fetched)
      } else {
        setJobs(prev => [...prev, ...fetched])
      }
      setTotal(pagination.total)
      setHasNext(pagination.hasNext)
      if (!reset) setPage(p => p + 1)
    } catch {
      setError('Could not reach the backend — is it running on port 5001?')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [buildFilters, page])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchJobs(true), search ? 300 : 0)
    return () => clearTimeout(t)
  }, [search, jobType, expLevel, salaryMin]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close panels on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (scrapeRef.current && !scrapeRef.current.contains(e.target as Node)) {
        setShowScraper(false)
      }
      if (resumeRef.current && !resumeRef.current.contains(e.target as Node)) {
        setShowResume(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const clearFilters = () => {
    setSearch(''); setJobType(''); setExpLevel(''); setSalaryMin(0)
  }

  const hasFilters = !!(search || jobType || expLevel || salaryMin)

  // Sort by match score when toggled (within loaded jobs)
  const displayedJobs = useMemo(() => {
    if (!sortByMatch || !hasResume) return jobs
    return [...jobs].sort((a, b) =>
      computeMatchScore(resumeSkills, b.skills) - computeMatchScore(resumeSkills, a.skills)
    )
  }, [jobs, sortByMatch, hasResume, resumeSkills])

  return (
    <div className="min-h-screen bg-background text-text">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-secondary opacity-90" />
            <span className="font-display font-bold text-base hidden sm:block">
              Job<span className="text-gradient-cyan">Finder</span>
            </span>
            <span className="text-[10px] text-muted hidden sm:block">Sydney</span>
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search title, company, skill…"
              className="input-base pl-9 py-2 text-sm h-9"
            />
          </div>

          {/* Resume button */}
          <div className="relative flex-shrink-0" ref={resumeRef}>
            <button
              onClick={() => { setShowResume(v => !v); setShowScraper(false) }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all',
                showResume
                  ? 'bg-secondary text-white border-secondary'
                  : hasResume
                  ? 'bg-secondary/10 border-secondary/30 text-secondary hover:border-secondary/60'
                  : 'bg-surface-2 border-border text-muted hover:text-text hover:border-border-bright'
              )}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">{hasResume ? 'Resume' : 'Add resume'}</span>
              {hasResume && (
                <span className="hidden sm:inline text-[10px] opacity-70">({resumeSkills.size} skills)</span>
              )}
            </button>
            <AnimatePresence>
              {showResume && <ResumePanel text={resumeText} onChange={handleResumeChange} />}
            </AnimatePresence>
          </div>

          {/* Scrape button */}
          <div className="relative flex-shrink-0" ref={scrapeRef}>
            <button
              onClick={() => { setShowScraper(v => !v); setShowResume(false) }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all',
                showScraper
                  ? 'bg-primary text-background border-primary'
                  : 'bg-surface-2 border-border text-muted hover:text-text hover:border-border-bright'
              )}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="hidden sm:inline">Fetch jobs</span>
            </button>
            <AnimatePresence>
              {showScraper && <ScrapePanel onDone={() => { setShowScraper(false); fetchJobs(true) }} />}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── Filter strip ── */}
      <div className="border-b border-border bg-surface-2/50">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2 flex-wrap">
          {/* Job type */}
          <div className="flex gap-1">
            {JOB_TYPES.map(opt => (
              <button
                key={opt.value}
                onClick={() => setJobType(opt.value)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                  jobType === opt.value
                    ? 'bg-primary text-background'
                    : 'text-muted hover:text-text hover:bg-surface-3'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border hidden sm:block" />

          {/* Exp level */}
          <div className="flex gap-1">
            {EXP_LEVELS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setExpLevel(opt.value)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                  expLevel === opt.value
                    ? 'bg-secondary text-white'
                    : 'text-muted hover:text-text hover:bg-surface-3'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border hidden sm:block" />

          {/* Salary */}
          <select
            value={salaryMin}
            onChange={e => setSalaryMin(Number(e.target.value))}
            className="bg-transparent text-xs text-muted border-none outline-none cursor-pointer hover:text-text transition-colors"
          >
            {SALARY_OPTS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Sort by match (only shown when resume is set) */}
          {hasResume && (
            <>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <button
                onClick={() => setSortByMatch(v => !v)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all',
                  sortByMatch
                    ? 'bg-secondary/15 text-secondary border border-secondary/30'
                    : 'text-muted hover:text-text hover:bg-surface-3'
                )}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Sort by match
              </button>
            </>
          )}

          {/* Right: stats + clear */}
          <div className="ml-auto flex items-center gap-3">
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-muted hover:text-primary transition-colors">
                Clear filters
              </button>
            )}
            {!loading && (
              <span className="text-xs text-muted tabular-nums">
                {total} job{total !== 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={() => fetchJobs(true)}
              className="text-muted hover:text-primary transition-colors"
              title="Refresh"
            >
              <svg className={cn('w-3.5 h-3.5', loading && 'animate-spin')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {error ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="h-14 w-14 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mb-4">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-text font-medium mb-1">{error}</p>
            <p className="text-sm text-muted mb-6">Start it with <code className="bg-surface-2 px-1.5 py-0.5 rounded text-primary">cd backend && npm run dev</code></p>
            <button onClick={() => fetchJobs(true)} className="btn-ghost text-sm px-4 py-2">Retry</button>
          </div>
        ) : loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="skeleton h-10 w-10 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="skeleton h-3 w-4/5" />
                    <div className="skeleton h-2.5 w-2/3" />
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <div className="skeleton h-5 w-16 rounded-full" />
                  <div className="skeleton h-5 w-14 rounded-full" />
                </div>
                <div className="flex gap-1">
                  <div className="skeleton h-4 w-12 rounded-full" />
                  <div className="skeleton h-4 w-16 rounded-full" />
                  <div className="skeleton h-4 w-10 rounded-full" />
                </div>
                <div className="skeleton h-px w-full" />
                <div className="flex justify-between">
                  <div className="skeleton h-2.5 w-16" />
                  <div className="skeleton h-6 w-14 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="h-16 w-16 rounded-2xl bg-surface-2 text-muted flex items-center justify-center mb-5">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="font-display text-xl font-bold text-text mb-2">No jobs yet</h2>
            <p className="text-sm text-muted mb-6 max-w-sm">
              Hit <strong className="text-text">Fetch jobs</strong> in the top-right to scrape Sydney tech jobs from Jora, Remotive, and RemoteOK.
            </p>
            <button
              onClick={() => setShowScraper(true)}
              className="btn-primary text-sm px-5 py-2.5"
            >
              Fetch jobs now
            </button>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedJobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.35 }}
                >
                  <JobCard
                    job={job}
                    matchScore={hasResume ? computeMatchScore(resumeSkills, job.skills) : undefined}
                  />
                </motion.div>
              ))}
            </div>

            {hasNext && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => { setLoadingMore(true); fetchJobs(false) }}
                  disabled={loadingMore}
                  className="btn-ghost text-sm px-6 py-2.5 flex items-center gap-2"
                >
                  {loadingMore ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : null}
                  {loadingMore ? 'Loading…' : `Load more (${total - jobs.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
