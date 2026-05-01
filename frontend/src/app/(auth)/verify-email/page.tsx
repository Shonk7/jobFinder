'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    const verify = async () => {
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')

      if (!token) {
        setStatus('error')
        setMessage('Verification token is missing.')
        return
      }

      const verifyUrl = `${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`

      if (!verifyUrl) {
        setStatus('error')
        setMessage('Verification token is missing.')
        return
      }

      try {
        const res = await fetch(verifyUrl)
        const data = await res.json()

        if (!res.ok) {
          setStatus('error')
          setMessage(data?.message || 'Email verification failed.')
          return
        }

        setStatus('success')
        setMessage(data?.message || 'Email verified successfully.')
      } catch {
        setStatus('error')
        setMessage('Unable to verify email right now. Please try again later.')
      }
    }

    void verify()
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-bold text-text mb-2">Email Verification</h1>
        <p className={`text-sm mb-6 ${status === 'error' ? 'text-danger' : status === 'success' ? 'text-emerald-400' : 'text-muted'}`}>
          {message}
        </p>
        <Link href="/login" className="text-primary hover:underline">
          Continue to sign in
        </Link>
      </div>
    </div>
  )
}
