'use client'

import React from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  children?: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'relative bg-gradient-to-r from-primary to-cyan-400 text-background',
    'font-semibold border border-transparent',
    'hover:opacity-90 hover:shadow-glow-cyan',
    'active:scale-[0.98]',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50 disabled:hover:shadow-none',
    'before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-primary/0 before:to-white/10 before:opacity-0 before:transition-opacity hover:before:opacity-100',
  ].join(' '),
  secondary: [
    'bg-secondary text-white font-semibold border border-transparent',
    'hover:bg-secondary-dark hover:shadow-glow-violet',
    'active:scale-[0.98]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
  ghost: [
    'bg-transparent text-text font-medium border border-border',
    'hover:border-primary/50 hover:text-primary hover:bg-primary/5',
    'active:scale-[0.98]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
  outline: [
    'bg-transparent text-primary font-medium border border-primary/40',
    'hover:border-primary hover:bg-primary/5',
    'active:scale-[0.98]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
  danger: [
    'bg-danger/10 text-danger font-medium border border-danger/30',
    'hover:bg-danger/20 hover:border-danger/60',
    'active:scale-[0.98]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-5 text-sm rounded-xl gap-2',
  lg: 'h-12 px-7 text-base rounded-xl gap-2.5',
  icon: 'h-10 w-10 rounded-xl',
}

const LoadingSpinner = ({ className }: { className?: string }) => (
  <svg
    className={cn('animate-spin', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
)

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-200 overflow-hidden select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <LoadingSpinner
            className={cn(
              size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
            )}
          />
        ) : (
          leftIcon
        )}
        {children && <span>{children}</span>}
        {!loading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
