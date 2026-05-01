'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glow?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost'
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

const variantClasses = {
  default: 'bg-surface border border-border',
  elevated: 'bg-surface-2 border border-border shadow-card',
  outlined: 'bg-transparent border border-border',
  ghost: 'bg-surface/50 border border-transparent',
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      hover = false,
      glow = false,
      padding = 'md',
      variant = 'default',
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl overflow-hidden transition-all duration-300',
          variantClasses[variant],
          paddingClasses[padding],
          hover && [
            'cursor-pointer',
            'hover:border-border-bright hover:shadow-card-hover',
            'hover:-translate-y-0.5',
          ],
          glow && 'hover:border-primary/30 hover:shadow-glow-sm',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

// Card sub-components
export const CardHeader = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-between gap-4', className)} {...props}>
    {children}
  </div>
)

CardHeader.displayName = 'CardHeader'

export const CardTitle = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn('font-display font-bold text-text text-lg leading-tight', className)}
    {...props}
  >
    {children}
  </h3>
)

CardTitle.displayName = 'CardTitle'

export const CardContent = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn(className)} {...props}>
    {children}
  </div>
)

CardContent.displayName = 'CardContent'

export const CardFooter = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex items-center justify-between gap-4 pt-4 border-t border-border', className)}
    {...props}
  >
    {children}
  </div>
)

CardFooter.displayName = 'CardFooter'

export default Card
