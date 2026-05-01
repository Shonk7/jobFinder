export interface Job {
  id: string
  title: string
  company: string
  location: string
  jobType: string
  industry: string
  experienceLevel: string
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string
  skills: string[]
  postedDate: string
  source: string
  url: string | null
  description: string
  isFeatured: boolean
}

export interface JobFilters {
  search?: string
  jobType?: string
  experienceLevel?: string
  salaryMin?: number
  page?: number
  limit?: number
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ApiResponse<T> {
  status: string
  data: T
  message?: string
}
