export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  profilePicture?: string
  createdAt: string
  updatedAt: string
  hasResume: boolean
  hasPreferences: boolean
}

export interface UserPreferences {
  id: string
  userId: string
  careerLevel: CareerLevel
  yearsOfExperience: number
  jobTypes: JobType[]
  workEnvironment: WorkEnvironment[]
  industries: string[]
  locations: string[]
  remotePreference: RemotePreference
  salaryMin: number
  salaryMax: number
  currency: string
  skills: string[]
  updatedAt: string
}

export enum CareerLevel {
  ENTRY = 'entry',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
  EXECUTIVE = 'executive',
}

export enum JobType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  FREELANCE = 'freelance',
  INTERNSHIP = 'internship',
}

export enum WorkEnvironment {
  REMOTE = 'remote',
  HYBRID = 'hybrid',
  ONSITE = 'onsite',
}

export enum RemotePreference {
  REMOTE_ONLY = 'remote_only',
  HYBRID_PREFERRED = 'hybrid_preferred',
  ONSITE_PREFERRED = 'onsite_preferred',
  FLEXIBLE = 'flexible',
}

export interface Resume {
  id: string
  userId: string
  fileName: string
  fileUrl: string
  parsedData: ParsedResumeData
  uploadedAt: string
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
}

export interface ParsedResumeData {
  skills: string[]
  yearsOfExperience: number
  educationLevel: string
  education: Education[]
  workExperience: WorkExperience[]
  summary?: string
}

export interface Education {
  institution: string
  degree: string
  field: string
  graduationYear?: number
}

export interface WorkExperience {
  company: string
  title: string
  startDate: string
  endDate?: string
  description: string
  skills: string[]
}

export interface JobListing {
  id: string
  title: string
  company: string
  companyLogo?: string
  location: string
  jobType: JobType
  workEnvironment: WorkEnvironment
  salaryMin?: number
  salaryMax?: number
  currency: string
  description: string
  requirements: string[]
  requiredSkills: string[]
  niceToHaveSkills: string[]
  industry: string
  experienceLevel: CareerLevel
  postedAt: string
  expiresAt?: string
  applicationUrl?: string
  sourceUrl: string
  isActive: boolean
}

export interface JobMatch {
  id: string
  jobListing: JobListing
  userId: string
  matchScore: number
  matchReasons: MatchReason[]
  isSaved: boolean
  isApplied: boolean
  createdAt: string
}

export interface MatchReason {
  category: 'skills' | 'experience' | 'location' | 'salary' | 'job_type'
  score: number
  description: string
}

export interface Application {
  id: string
  userId: string
  jobListing: JobListing
  status: ApplicationStatus
  appliedAt: string
  updatedAt: string
  notes?: string
  resumeId: string
  coverLetter?: string
  interviewDate?: string
  offerDetails?: OfferDetails
}

export enum ApplicationStatus {
  APPLIED = 'applied',
  SCREENING = 'screening',
  INTERVIEW = 'interview',
  OFFER = 'offer',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export interface OfferDetails {
  salary: number
  currency: string
  equity?: string
  startDate?: string
  benefits?: string[]
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface JobFilters {
  jobType?: JobType[]
  workEnvironment?: WorkEnvironment[]
  location?: string
  salaryMin?: number
  salaryMax?: number
  industry?: string[]
  experienceLevel?: CareerLevel[]
  search?: string
  page?: number
  limit?: number
}

export interface DashboardStats {
  matchesFound: number
  applicationsSent: number
  profileStrength: number
  savedJobs: number
  interviewsScheduled: number
}
