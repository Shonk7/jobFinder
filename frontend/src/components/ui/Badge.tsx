'use client'

import React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'muted'
  | 'outline'

type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  removable?: boolean
  onRemove?: () => void
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-2 border-border text-text-secondary',
  primary: 'bg-primary/10 border-primary/30 text-primary',
  secondary: 'bg-secondary/10 border-secondary/30 text-purple-400',
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  danger: 'bg-red-500/10 border-red-500/30 text-red-400',
  muted: 'bg-surface border-border text-muted',
  outline: 'bg-transparent border-border text-text',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-0.5 text-xs gap-1.5',
  lg: 'px-3 py-1 text-sm gap-2',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-muted',
  primary: 'bg-primary',
  secondary: 'bg-purple-400',
  success: 'bg-emerald-400',
  warning: 'bg-yellow-400',
  danger: 'bg-red-400',
  muted: 'bg-muted',
  outline: 'bg-text',
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      dot = false,
      removable = false,
      onRemove,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border font-medium transition-colors duration-150',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn('rounded-full flex-shrink-0', dotColors[variant], 'h-1.5 w-1.5')}
          />
        )}
        {children}
        {removable && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="ml-0.5 rounded-full hover:bg-black/10 transition-colors p-0.5 -mr-0.5"
            aria-label="Remove"
          >
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
              <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

// Status-specific badge for application status
export function ApplicationStatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: BadgeVariant; label: string }> = {
    applied: { variant: 'primary', label: 'Applied' },
    screening: { variant: 'warning', label: 'Screening' },
    interview: { variant: 'secondary', label: 'Interview' },
    offer: { variant: 'success', label: 'Offer' },
    rejected: { variant: 'danger', label: 'Rejected' },
    withdrawn: { variant: 'muted', label: 'Withdrawn' },
  }

  const { variant, label } = config[status] || { variant: 'muted' as BadgeVariant, label: status }

  return <Badge variant={variant} dot>{label}</Badge>
}

export default Badge
