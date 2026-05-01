import axios from 'axios'
import { Job, JobFilters, Pagination } from '@/types'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

const http = axios.create({ baseURL: API, timeout: 120_000 })

export const jobsApi = {
  search: (filters: JobFilters = {}) =>
    http.get<{ status: string; data: { jobs: Job[]; pagination: Pagination } }>('/jobs/search', {
      params: { ...filters, limit: filters.limit ?? 24 },
    }),
}

export const scraperApi = {
  run: (opts?: { source?: string; query?: string; limit?: number }) =>
    http.post<{ status: string; data: { created: number; updated: number; totalActive: number | null } }>(
      '/scrape',
      opts ?? { source: 'all', limit: 100 },
    ),
}

export default http
