import { create } from 'zustand'
import { JobFilters, JobMatch } from '@/types'

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface JobState {
  jobs: JobMatch[]
  savedJobs: JobMatch[]
  filters: JobFilters
  pagination: Pagination
  isLoading: boolean
  error: string | null
}

interface JobActions {
  setJobs: (jobs: JobMatch[], pagination: Pagination) => void
  appendJobs: (jobs: JobMatch[], pagination: Pagination) => void
  setFilters: (filters: Partial<JobFilters>) => void
  clearFilters: () => void
  toggleSaveJob: (jobId: string) => void
  setSavedJobs: (jobs: JobMatch[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  markAsApplied: (jobId: string) => void
}

type JobStore = JobState & JobActions

const defaultFilters: JobFilters = {
  page: 1,
  limit: 12,
}

const defaultPagination: Pagination = {
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
}

export const useJobStore = create<JobStore>((set, get) => ({
  jobs: [],
  savedJobs: [],
  filters: defaultFilters,
  pagination: defaultPagination,
  isLoading: false,
  error: null,

  setJobs: (jobs, pagination) => {
    set({ jobs, pagination, error: null })
  },

  appendJobs: (newJobs, pagination) => {
    const existingJobs = get().jobs
    const existingIds = new Set(existingJobs.map((j) => j.id))
    const uniqueNewJobs = newJobs.filter((j) => !existingIds.has(j.id))
    set({ jobs: [...existingJobs, ...uniqueNewJobs], pagination })
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: 1 },
    }))
  },

  clearFilters: () => {
    set({ filters: defaultFilters })
  },

  toggleSaveJob: (jobId) => {
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId ? { ...job, isSaved: !job.isSaved } : job
      ),
    }))
  },

  setSavedJobs: (jobs) => {
    set({ savedJobs: jobs })
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  markAsApplied: (jobId) => {
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId ? { ...job, isApplied: true } : job
      ),
    }))
  },
}))
