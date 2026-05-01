'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CareerLevel, JobType, WorkEnvironment } from '@/types'
import { preferencesApi } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

const schema = z.object({
  careerLevel: z.nativeEnum(CareerLevel),
  yearsOfExperience: z.number().min(0).max(40),
  jobTypes: z.array(z.nativeEnum(JobType)).min(1, 'Select at least one job type'),
  workEnvironment: z.array(z.nativeEnum(WorkEnvironment)).min(1, 'Select at least one environment'),
  industries: z.array(z.string()).min(1, 'Select at least one industry'),
  locations: z.array(z.string()),
  salaryMin: z.number().min(0),
  salaryMax: z.number().min(0),
  currency: z.string().default('USD'),
})

type FormData = z.infer<typeof schema>

const TOTAL_STEPS = 4

const CAREER_LEVELS = [
  { value: CareerLevel.ENTRY, label: 'Entry Level', desc: '0–2 years', icon: '🌱' },
  { value: CareerLevel.MID, label: 'Mid Level', desc: '2–5 years', icon: '⚡' },
  { value: CareerLevel.SENIOR, label: 'Senior', desc: '5–10 years', icon: '🔥' },
  { value: CareerLevel.LEAD, label: 'Lead / Staff', desc: '8+ years', icon: '🚀' },
  { value: CareerLevel.EXECUTIVE, label: 'Executive', desc: '12+ years', icon: '👑' },
]

const JOB_TYPES = [
  { value: JobType.FULL_TIME, label: 'Full-time', icon: '💼' },
  { value: JobType.PART_TIME, label: 'Part-time', icon: '⏰' },
  { value: JobType.CONTRACT, label: 'Contract', icon: '📝' },
  { value: JobType.FREELANCE, label: 'Freelance', icon: '🏄' },
  { value: JobType.INTERNSHIP, label: 'Internship', icon: '🎓' },
]

const WORK_ENVS = [
  { value: WorkEnvironment.REMOTE, label: 'Remote', icon: '🌍', desc: 'Work from anywhere' },
  { value: WorkEnvironment.HYBRID, label: 'Hybrid', icon: '🏢', desc: 'Mix of remote & office' },
  { value: WorkEnvironment.ONSITE, label: 'On-site', icon: '🏙️', desc: 'In-office full time' },
]

const INDUSTRIES = [
  'Technology', 'Finance & Fintech', 'Healthcare', 'E-commerce', 'Media & Entertainment',
  'Education', 'Real Estate', 'Government', 'Consulting', 'Manufacturing',
  'Automotive', 'Energy', 'Legal', 'Marketing & Advertising', 'Logistics',
]

const POPULAR_LOCATIONS = [
  'Remote', 'New York, NY', 'San Francisco, CA', 'Seattle, WA', 'Austin, TX',
  'Boston, MA', 'Chicago, IL', 'Los Angeles, CA', 'Denver, CO', 'Miami, FL',
  'London, UK', 'Toronto, Canada', 'Berlin, Germany', 'Singapore',
]


interface PreferencesFormProps {
  onComplete?: () => void
}

export default function PreferencesForm({ onComplete }: PreferencesFormProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [industrySearch, setIndustrySearch] = useState('')

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      careerLevel: CareerLevel.MID,
      yearsOfExperience: 3,
      jobTypes: [JobType.FULL_TIME],
      workEnvironment: [WorkEnvironment.REMOTE],
      industries: [],
      locations: [],
      salaryMin: 80000,
      salaryMax: 150000,
      currency: 'USD',
    },
  })

  const { watch, setValue, handleSubmit } = form
  const values = watch()

  const toggleArray = <T,>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      await preferencesApi.create({
        careerLevel: data.careerLevel,
        yearsOfExperience: data.yearsOfExperience,
        jobTypes: data.jobTypes,
        workEnvironment: data.workEnvironment,
        industries: data.industries,
        locations: data.locations,
        remotePreference: 'flexible' as never,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        currency: data.currency,
        skills: [],
      })
      onComplete?.()
    } catch {
      // Handle error
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredIndustries = INDUSTRIES.filter((ind) =>
    ind.toLowerCase().includes(industrySearch.toLowerCase())
  )

  const stepVariants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted mb-1">
          <span>Step {step} of {TOTAL_STEPS}</span>
          <span>{Math.round((step / TOTAL_STEPS) * 100)}% complete</span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                'h-1 rounded-full flex-1 transition-all duration-500',
                i < step ? 'bg-primary' : 'bg-border'
              )}
              animate={{ scaleX: i < step ? 1 : 0.6 }}
              style={{ transformOrigin: 'left' }}
            />
          ))}
        </div>
        <div className="flex gap-1.5">
          {['Career', 'Job Type', 'Industries', 'Salary'].map((label, i) => (
            <div key={label} className={cn('flex-1 text-center text-[10px] font-medium transition-colors', i < step ? 'text-primary' : 'text-muted')}>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {/* Step 1: Career level */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-lg font-bold text-text mb-1">Career Level</h3>
                <p className="text-sm text-muted">Where are you in your career journey?</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CAREER_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setValue('careerLevel', level.value)}
                    className={cn(
                      'flex flex-col items-start gap-1.5 p-4 rounded-xl border text-left transition-all duration-200',
                      values.careerLevel === level.value
                        ? 'border-primary bg-primary/10 shadow-glow-sm'
                        : 'border-border bg-surface hover:border-border-bright hover:bg-surface-2'
                    )}
                  >
                    <span className="text-xl">{level.icon}</span>
                    <span className={cn('font-semibold text-sm', values.careerLevel === level.value ? 'text-primary' : 'text-text')}>
                      {level.label}
                    </span>
                    <span className="text-xs text-muted">{level.desc}</span>
                  </button>
                ))}
              </div>

              {/* Years experience slider */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-text-secondary">
                    Years of Experience
                  </label>
                  <span className="text-sm font-bold text-primary">
                    {values.yearsOfExperience} {values.yearsOfExperience === 1 ? 'year' : 'years'}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={25}
                  step={1}
                  value={values.yearsOfExperience}
                  onChange={(e) => setValue('yearsOfExperience', Number(e.target.value))}
                  className="w-full accent-primary"
                  style={{
                    background: `linear-gradient(to right, #00d4ff ${(values.yearsOfExperience / 25) * 100}%, #1e1e2e ${(values.yearsOfExperience / 25) * 100}%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-muted mt-1">
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
                  <span>15</span>
                  <span>20+</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Job type + work environment */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-lg font-bold text-text mb-1">Job Preferences</h3>
                <p className="text-sm text-muted">Select all that apply to your search.</p>
              </div>

              {/* Job types */}
              <div>
                <p className="text-sm font-medium text-text-secondary mb-3">Employment Type</p>
                <div className="flex flex-wrap gap-2">
                  {JOB_TYPES.map((type) => {
                    const isSelected = values.jobTypes.includes(type.value)
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setValue('jobTypes', toggleArray(values.jobTypes, type.value))}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200',
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-surface text-muted hover:border-border-bright hover:text-text'
                        )}
                      >
                        <span>{type.icon}</span>
                        {type.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Work environment */}
              <div>
                <p className="text-sm font-medium text-text-secondary mb-3">Work Environment</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {WORK_ENVS.map((env) => {
                    const isSelected = values.workEnvironment.includes(env.value)
                    return (
                      <button
                        key={env.value}
                        type="button"
                        onClick={() => setValue('workEnvironment', toggleArray(values.workEnvironment, env.value))}
                        className={cn(
                          'flex flex-col items-center gap-1.5 p-4 rounded-xl border text-center transition-all duration-200',
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-surface hover:border-border-bright hover:bg-surface-2'
                        )}
                      >
                        <span className="text-2xl">{env.icon}</span>
                        <span className={cn('font-semibold text-sm', isSelected ? 'text-primary' : 'text-text')}>{env.label}</span>
                        <span className="text-xs text-muted">{env.desc}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Industries + locations */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-lg font-bold text-text mb-1">Industries & Locations</h3>
                <p className="text-sm text-muted">Narrow down where you want to work.</p>
              </div>

              {/* Industries */}
              <div>
                <p className="text-sm font-medium text-text-secondary mb-3">
                  Industries
                  {values.industries.length > 0 && (
                    <Badge variant="primary" size="sm" className="ml-2">{values.industries.length}</Badge>
                  )}
                </p>
                <input
                  type="text"
                  placeholder="Search industries..."
                  value={industrySearch}
                  onChange={(e) => setIndustrySearch(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-surface border border-border text-text placeholder:text-muted focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 mb-3"
                />
                <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1">
                  {filteredIndustries.map((industry) => {
                    const isSelected = values.industries.includes(industry)
                    return (
                      <button
                        key={industry}
                        type="button"
                        onClick={() => setValue('industries', toggleArray(values.industries, industry))}
                        className={cn(
                          'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150',
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-surface text-muted hover:border-border-bright hover:text-text'
                        )}
                      >
                        {industry}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Locations */}
              <div>
                <p className="text-sm font-medium text-text-secondary mb-3">
                  Preferred Locations
                  {values.locations.length > 0 && (
                    <Badge variant="secondary" size="sm" className="ml-2">{values.locations.length}</Badge>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_LOCATIONS.map((loc) => {
                    const isSelected = values.locations.includes(loc)
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setValue('locations', toggleArray(values.locations, loc))}
                        className={cn(
                          'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150',
                          isSelected
                            ? 'border-secondary/60 bg-secondary/10 text-purple-400'
                            : 'border-border bg-surface text-muted hover:border-border-bright hover:text-text'
                        )}
                      >
                        {loc}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Salary range */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-lg font-bold text-text mb-1">Salary Expectations</h3>
                <p className="text-sm text-muted">Set your desired compensation range.</p>
              </div>

              {/* Salary display */}
              <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-border rounded-2xl p-6 text-center">
                <div className="font-display text-3xl font-bold text-text mb-1">
                  <span className="text-primary">${(values.salaryMin / 1000).toFixed(0)}k</span>
                  <span className="text-muted mx-3">—</span>
                  <span className="text-primary">${(values.salaryMax / 1000).toFixed(0)}k</span>
                </div>
                <p className="text-sm text-muted">Annual salary in USD</p>
              </div>

              {/* Min slider */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-secondary font-medium">Minimum</span>
                  <span className="text-primary font-bold">${(values.salaryMin / 1000).toFixed(0)}k/yr</span>
                </div>
                <input
                  type="range"
                  min={30000}
                  max={300000}
                  step={5000}
                  value={values.salaryMin}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    setValue('salaryMin', Math.min(val, values.salaryMax - 10000))
                  }}
                  className="w-full"
                  style={{
                    background: `linear-gradient(to right, #00d4ff ${((values.salaryMin - 30000) / 270000) * 100}%, #1e1e2e ${((values.salaryMin - 30000) / 270000) * 100}%)`,
                  }}
                />
              </div>

              {/* Max slider */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-secondary font-medium">Maximum</span>
                  <span className="text-primary font-bold">${(values.salaryMax / 1000).toFixed(0)}k/yr</span>
                </div>
                <input
                  type="range"
                  min={30000}
                  max={500000}
                  step={5000}
                  value={values.salaryMax}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    setValue('salaryMax', Math.max(val, values.salaryMin + 10000))
                  }}
                  className="w-full"
                  style={{
                    background: `linear-gradient(to right, #00d4ff ${((values.salaryMax - 30000) / 470000) * 100}%, #1e1e2e ${((values.salaryMax - 30000) / 470000) * 100}%)`,
                  }}
                />
              </div>

              {/* Quick select buttons */}
              <div>
                <p className="text-xs text-muted mb-2">Quick ranges</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '$40–$80k', min: 40000, max: 80000 },
                    { label: '$80–$120k', min: 80000, max: 120000 },
                    { label: '$120–$180k', min: 120000, max: 180000 },
                    { label: '$180k+', min: 180000, max: 300000 },
                  ].map((range) => (
                    <button
                      key={range.label}
                      type="button"
                      onClick={() => {
                        setValue('salaryMin', range.min)
                        setValue('salaryMax', range.max)
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150',
                        values.salaryMin === range.min && values.salaryMax === range.max
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted hover:border-border-bright hover:text-text'
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          Back
        </Button>

        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i + 1)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i + 1 === step ? 'w-6 bg-primary' : i + 1 < step ? 'w-2 bg-primary/50' : 'w-2 bg-border'
              )}
            />
          ))}
        </div>

        {step < TOTAL_STEPS ? (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
          >
            Next
          </Button>
        ) : (
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isSubmitting}
          >
            Save Preferences
          </Button>
        )}
      </div>
    </form>
  )
}
