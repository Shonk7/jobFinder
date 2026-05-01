import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import {
  ApiResponse,
  Application,
  AuthTokens,
  DashboardStats,
  JobFilters,
  JobMatch,
  PaginatedResponse,
  ParsedResumeData,
  Resume,
  User,
  UserPreferences,
} from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Track if we're currently refreshing the token to prevent loops
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: string | null) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Request interceptor: add Authorization header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the failed request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          if (originalRequest.headers && token) {
            originalRequest.headers['Authorization'] = `Bearer ${token}`
          }
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = typeof window !== 'undefined'
          ? localStorage.getItem('refreshToken')
          : null

        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const response = await axios.post<ApiResponse<AuthTokens>>(
          `${API_URL}/auth/refresh`,
          { refreshToken }
        )

        const { accessToken, refreshToken: newRefreshToken } = response.data.data

        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', newRefreshToken)
        }

        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`
        }

        processQueue(null, accessToken)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)

        // Clear auth state on refresh failure
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }

        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ─── Auth API ────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => api.post<ApiResponse<{ user: User; tokens: AuthTokens }>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: User; tokens: AuthTokens }>>('/auth/login', data),

  logout: () => api.post<ApiResponse<null>>('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    api.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken }),

  me: () => api.get<ApiResponse<User>>('/auth/me'),
}

// ─── User API ─────────────────────────────────────────────────────────────────

export const userApi = {
  getProfile: () => api.get<ApiResponse<User>>('/users/me'),

  updateProfile: (data: Partial<User>) =>
    api.patch<ApiResponse<User>>('/users/me', data),

  deleteAccount: () => api.delete<ApiResponse<null>>('/users/me'),
}

// ─── Resume API ───────────────────────────────────────────────────────────────

export const resumeApi = {
  upload: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData()
    formData.append('resume', file)
    return api.post<ApiResponse<Resume>>('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
  },

  getMyResumes: () => api.get<ApiResponse<Resume[]>>('/resumes'),

  getResume: (id: string) => api.get<ApiResponse<Resume>>(`/resumes/${id}`),

  deleteResume: (id: string) => api.delete<ApiResponse<null>>(`/resumes/${id}`),

  triggerMatching: (resumeId: string) =>
    api.post<ApiResponse<{ jobsMatched: number }>>(`/resumes/${resumeId}/match`),

  getParsedData: (resumeId: string) =>
    api.get<ApiResponse<ParsedResumeData>>(`/resumes/${resumeId}/parsed`),
}

// ─── Preferences API ──────────────────────────────────────────────────────────

export const preferencesApi = {
  get: () => api.get<ApiResponse<UserPreferences>>('/preferences'),

  create: (data: Omit<UserPreferences, 'id' | 'userId' | 'updatedAt'>) =>
    api.post<ApiResponse<UserPreferences>>('/preferences', data),

  update: (data: Partial<UserPreferences>) =>
    api.patch<ApiResponse<UserPreferences>>('/preferences', data),
}

// ─── Jobs API ─────────────────────────────────────────────────────────────────

export const jobsApi = {
  getMatches: (filters?: JobFilters) =>
    api.get<PaginatedResponse<JobMatch>>('/jobs/matches', { params: filters }),

  getJob: (id: string) => api.get<ApiResponse<JobMatch>>(`/jobs/${id}`),

  saveJob: (jobId: string) => api.post<ApiResponse<JobMatch>>(`/jobs/${jobId}/save`),

  unsaveJob: (jobId: string) => api.delete<ApiResponse<JobMatch>>(`/jobs/${jobId}/save`),

  getSavedJobs: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<JobMatch>>('/jobs/saved', { params }),

  refreshMatches: () =>
    api.post<ApiResponse<{ matchesFound: number }>>('/jobs/refresh-matches'),
}

// ─── Applications API ─────────────────────────────────────────────────────────

export const applicationsApi = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Application>>('/applications', { params }),

  getById: (id: string) => api.get<ApiResponse<Application>>(`/applications/${id}`),

  create: (data: {
    jobListingId: string
    resumeId: string
    coverLetter?: string
    notes?: string
  }) => api.post<ApiResponse<Application>>('/applications', data),

  updateStatus: (id: string, status: string, notes?: string) =>
    api.patch<ApiResponse<Application>>(`/applications/${id}/status`, { status, notes }),

  delete: (id: string) => api.delete<ApiResponse<null>>(`/applications/${id}`),
}

// ─── Dashboard API ────────────────────────────────────────────────────────────

export const dashboardApi = {
  getStats: () => api.get<ApiResponse<DashboardStats>>('/dashboard/stats'),
}

export default api
