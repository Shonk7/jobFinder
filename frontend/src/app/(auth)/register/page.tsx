'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { authApi } from '@/lib/api'
import { useUserStore } from '@/store/userStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useState } from 'react'

const schema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
    email: z.string().email('Please enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

const PasswordStrength = ({ password }: { password: string }) => {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
    { label: 'Special char', pass: /[^A-Za-z0-9]/.test(password) },
  ]
  const score = checks.filter((c) => c.pass).length

  const colors = ['bg-danger', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400', 'bg-emerald-400']
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']

  if (!password) return null

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score] : 'bg-border'}`}
          />
        ))}
        <span className={`text-xs font-medium ml-1 ${colors[score].replace('bg-', 'text-')}`}>
          {labels[score]}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {checks.map((check) => (
          <span key={check.label} className={`text-[11px] flex items-center gap-1 ${check.pass ? 'text-emerald-400' : 'text-muted'}`}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
              {check.pass ? (
                <path d="M2 6l2.5 2.5 5.5-5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
              )}
            </svg>
            {check.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const { setAuth, continueAsGuest } = useUserStore()
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const password = watch('password', '')

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      const response = await authApi.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      })
      const { user, accessToken, refreshToken } = response.data.data
      setAuth(user, accessToken, refreshToken)
      router.push('/dashboard/upload')
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || err.message
          : 'Registration failed. Please try again.'
      setServerError(message)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-dot-pattern opacity-30" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-secondary/10 via-transparent to-transparent blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-surface border border-border rounded-3xl p-8 shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative h-14 w-14 mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="h-7 w-7 text-white" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8C2 4.686 4.686 2 8 2s6 2.686 6 6-2.686 6-6 6-6-2.686-6-6z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="11" cy="11" r="3.5" fill="currentColor" className="text-primary" />
                  <path d="M10 11l.8.8L12.5 9.5" stroke="#0a0a0f" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <h1 className="font-display text-2xl font-bold text-text mb-1">
              Create your account
            </h1>
            <p className="text-sm text-muted text-center">
              Start finding your perfect role with{' '}
              <span className="text-primary font-medium">AI-powered matching</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                placeholder="Jane"
                error={errors.firstName?.message}
                autoComplete="given-name"
                {...register('firstName')}
              />
              <Input
                label="Last name"
                placeholder="Smith"
                error={errors.lastName?.message}
                autoComplete="family-name"
                {...register('lastName')}
              />
            </div>

            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              autoComplete="email"
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              {...register('email')}
            />

            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                error={errors.password?.message}
                autoComplete="new-password"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted hover:text-text transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      )}
                    </svg>
                  </button>
                }
                {...register('password')}
              />
              <PasswordStrength password={password} />
            </div>

            <Input
              label="Confirm password"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repeat your password"
              error={errors.confirmPassword?.message}
              autoComplete="new-password"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="text-muted hover:text-text transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    {showConfirm ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </>
                    )}
                  </svg>
                </button>
              }
              {...register('confirmPassword')}
            />

            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/30 rounded-xl text-sm text-danger"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {serverError}
              </motion.div>
            )}

            <p className="text-xs text-muted">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-primary hover:underline">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
            </p>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
            >
              Create account
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              fullWidth
              onClick={() => {
                continueAsGuest()
                router.push('/dashboard')
              }}
            >
              Continue as guest
            </Button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted">already a member?</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <p className="text-center text-sm text-muted">
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in to your account
            </Link>
          </p>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-muted hover:text-text transition-colors flex items-center justify-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
