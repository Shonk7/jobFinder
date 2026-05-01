'use client'

import { useEffect } from 'react'

const WARMUP_KEY = 'backendWarmupAt'
const WARMUP_TTL_MS = 5 * 60 * 1000

export default function BackendWarmup() {
  useEffect(() => {
    const now = Date.now()

    try {
      const last = Number(sessionStorage.getItem(WARMUP_KEY) || '0')
      if (last && now - last < WARMUP_TTL_MS) {
        return
      }
      sessionStorage.setItem(WARMUP_KEY, String(now))
    } catch {
      // Ignore storage issues and still attempt warmup.
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
    const healthUrl = `${apiBase.replace(/\/$/, '')}/health`

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)

    void fetch(healthUrl, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timer)
    })
  }, [])

  return null
}
