'use client'

import Link from 'next/link'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-bold text-text mb-2">Forgot Password</h1>
        <p className="text-sm text-muted mb-6">
          Password reset is not available yet in this deployment.
        </p>
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
