import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSalary(
  min?: number,
  max?: number,
  currency: string = 'USD'
): string {
  if (!min && !max) return 'Salary not disclosed'

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    notation: 'compact',
    compactDisplay: 'short',
  })

  if (min && max) {
    return `${formatter.format(min)} – ${formatter.format(max)}`
  }

  if (min) return `From ${formatter.format(min)}`
  if (max) return `Up to ${formatter.format(max)}`
  return 'Salary not disclosed'
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

export function formatFullDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function getMatchColor(score: number): string {
  if (score >= 90) return 'text-emerald-400'
  if (score >= 75) return 'text-primary'
  if (score >= 60) return 'text-yellow-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}

export function getMatchBgColor(score: number): string {
  if (score >= 90) return 'bg-emerald-400/10 border-emerald-400/30'
  if (score >= 75) return 'bg-primary/10 border-primary/30'
  if (score >= 60) return 'bg-yellow-400/10 border-yellow-400/30'
  if (score >= 40) return 'bg-orange-400/10 border-orange-400/30'
  return 'bg-red-400/10 border-red-400/30'
}

export function getMatchStrokeColor(score: number): string {
  if (score >= 90) return '#10b981'
  if (score >= 75) return '#00d4ff'
  if (score >= 60) return '#f59e0b'
  if (score >= 40) return '#f97316'
  return '#ef4444'
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function getCompanyInitials(company: string): string {
  const words = company.split(' ').filter(Boolean)
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
  return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase()
}

export function formatJobType(jobType: string): string {
  const map: Record<string, string> = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    contract: 'Contract',
    freelance: 'Freelance',
    internship: 'Internship',
  }
  return map[jobType] || jobType
}

export function formatWorkEnvironment(env: string): string {
  const map: Record<string, string> = {
    remote: 'Remote',
    hybrid: 'Hybrid',
    onsite: 'On-site',
  }
  return map[env] || env
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength).trimEnd() + '...'
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
