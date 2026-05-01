import { Application, ApplicationStatus, CareerLevel, DashboardStats, JobMatch, JobType, UserPreferences, WorkEnvironment, Resume, ParsedResumeData } from '@/types'

const GUEST_PREFERENCES_KEY = 'jobfinder-guest-preferences'
const GUEST_RESUMES_KEY = 'jobfinder-guest-resumes'
const GUEST_APPLICATIONS_KEY = 'jobfinder-guest-applications'
const GUEST_MATCHES_KEY = 'jobfinder-guest-matches'

const nowIso = () => new Date().toISOString()

const safeRead = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const safeWrite = <T>(key: string, value: T) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

const makeJob = (
  id: string,
  title: string,
  company: string,
  location: string,
  matchScore: number,
  salaryMin: number,
  salaryMax: number,
  requiredSkills: string[],
  jobType: JobType,
  workEnvironment: WorkEnvironment
): JobMatch => ({
  id,
  userId: 'guest-local',
  matchScore,
  isSaved: false,
  isApplied: false,
  createdAt: nowIso(),
  matchReasons: [
    { category: 'skills', score: 0.9, description: `Strong overlap with ${requiredSkills[0]} and core stack.` },
    { category: 'experience', score: 0.8, description: 'Experience level aligns well with role seniority.' },
  ],
  jobListing: {
    id: `listing-${id}`,
    title,
    company,
    location,
    jobType,
    workEnvironment,
    salaryMin,
    salaryMax,
    currency: 'USD',
    description: `${title} role focused on product delivery and collaborative engineering execution.`,
    requirements: requiredSkills,
    requiredSkills,
    niceToHaveSkills: ['Communication', 'Ownership'],
    industry: 'Technology',
    experienceLevel: CareerLevel.MID,
    postedAt: nowIso(),
    sourceUrl: 'https://example.com/job',
    isActive: true,
  },
})

const DEMO_JOBS: JobMatch[] = [
  makeJob('demo-1', 'Frontend Engineer', 'Northstar Labs', 'Remote (US)', 92, 120000, 160000, ['React', 'TypeScript', 'Next.js'], JobType.FULL_TIME, WorkEnvironment.REMOTE),
  makeJob('demo-2', 'Full Stack Developer', 'Orbit Commerce', 'Austin, TX', 87, 110000, 145000, ['Node.js', 'PostgreSQL', 'React'], JobType.FULL_TIME, WorkEnvironment.HYBRID),
  makeJob('demo-3', 'Product Engineer', 'Pixel & Pine', 'New York, NY', 81, 100000, 130000, ['JavaScript', 'APIs', 'UX'], JobType.CONTRACT, WorkEnvironment.ONSITE),
]

export const getGuestJobMatches = (): JobMatch[] => {
  return safeRead<JobMatch[]>(GUEST_MATCHES_KEY, DEMO_JOBS)
}

export const getGuestStats = (): DashboardStats => {
  const applications = getGuestApplications()
  return {
    matchesFound: DEMO_JOBS.length,
    applicationsSent: applications.length,
    profileStrength: getGuestPreferences() ? 82 : 44,
    savedJobs: getGuestJobMatches().filter((j) => j.isSaved).length,
    interviewsScheduled: applications.filter((a) => a.status === ApplicationStatus.INTERVIEW).length,
  }
}

export const getGuestPreferences = (): UserPreferences | null => {
  return safeRead<UserPreferences | null>(GUEST_PREFERENCES_KEY, null)
}

export const saveGuestPreferences = (prefs: UserPreferences) => {
  safeWrite(GUEST_PREFERENCES_KEY, prefs)
}

export const getGuestResumes = (): Resume[] => {
  return safeRead<Resume[]>(GUEST_RESUMES_KEY, [])
}

export const saveGuestResume = (resume: Resume) => {
  const existing = getGuestResumes()
  safeWrite(GUEST_RESUMES_KEY, [resume, ...existing])
}

export const deleteGuestResume = (resumeId: string) => {
  safeWrite(
    GUEST_RESUMES_KEY,
    getGuestResumes().filter((resume) => resume.id !== resumeId)
  )
}

export const createGuestResumeFromFile = (file: File): Resume => {
  const parsedData: ParsedResumeData = {
    skills: ['Communication', 'Problem Solving', 'Teamwork'],
    yearsOfExperience: 2,
    educationLevel: 'bachelor',
    education: [],
    workExperience: [],
  }

  return {
    id: `guest-resume-${Date.now()}`,
    userId: 'guest-local',
    fileName: file.name,
    fileUrl: 'local://resume',
    parsedData,
    uploadedAt: nowIso(),
    processingStatus: 'completed',
  }
}

export const getGuestApplications = (): Application[] => {
  return safeRead<Application[]>(GUEST_APPLICATIONS_KEY, [])
}

export const addGuestApplicationFromJob = (job: JobMatch) => {
  const apps = getGuestApplications()
  if (apps.some((app) => app.jobListing.id === job.jobListing.id)) return

  const application: Application = {
    id: `guest-app-${Date.now()}`,
    userId: 'guest-local',
    jobListing: job.jobListing,
    status: ApplicationStatus.APPLIED,
    appliedAt: nowIso(),
    updatedAt: nowIso(),
    resumeId: '',
  }

  safeWrite(GUEST_APPLICATIONS_KEY, [application, ...apps])
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export const triggerGuestMatching = (resumeId?: string): { jobsMatched: number } => {
  const resumes = getGuestResumes()
  if (resumes.length === 0) {
    safeWrite(GUEST_MATCHES_KEY, DEMO_JOBS)
    return { jobsMatched: DEMO_JOBS.length }
  }

  const targetResume = resumeId
    ? resumes.find((resume) => resume.id === resumeId) || resumes[0]
    : resumes[0]

  const skills = new Set((targetResume.parsedData?.skills || []).map((skill) => skill.toLowerCase()))
  const prefs = getGuestPreferences()

  const matched = DEMO_JOBS.map((job) => {
    const jobSkills = job.jobListing.requiredSkills.map((skill) => skill.toLowerCase())
    const overlappingSkills = job.jobListing.requiredSkills.filter((skill) => skills.has(skill.toLowerCase()))
    const overlapRatio = jobSkills.length > 0 ? overlappingSkills.length / jobSkills.length : 0

    let score = 55 + overlapRatio * 35

    if (prefs) {
      if (prefs.workEnvironment.includes(job.jobListing.workEnvironment)) score += 5
      if (prefs.locations.some((loc) => job.jobListing.location.toLowerCase().includes(loc.toLowerCase()))) score += 3
      if (
        job.jobListing.salaryMin &&
        job.jobListing.salaryMax &&
        prefs.salaryMin <= job.jobListing.salaryMax &&
        prefs.salaryMax >= job.jobListing.salaryMin
      ) {
        score += 4
      }
    }

    const normalizedScore = clamp(Math.round(score), 45, 98)
    const skillReason = overlappingSkills.length > 0
      ? `Your resume matches ${overlappingSkills.slice(0, 2).join(', ')}.`
      : 'Role aligns with your profile baseline and transferable skills.'

    return {
      ...job,
      matchScore: normalizedScore,
      matchReasons: [
        { category: 'skills', score: overlapRatio || 0.5, description: skillReason },
        { category: 'experience', score: 0.75, description: 'Experience level appears compatible with this role.' },
      ],
      createdAt: nowIso(),
    }
  }).sort((a, b) => b.matchScore - a.matchScore)

  safeWrite(GUEST_MATCHES_KEY, matched)
  return { jobsMatched: matched.length }
}
