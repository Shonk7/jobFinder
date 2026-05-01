'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/userStore'

export default function GuestEntryPage() {
  const router = useRouter()
  const continueAsGuest = useUserStore((state) => state.continueAsGuest)

  useEffect(() => {
    continueAsGuest()
    router.replace('/dashboard')
  }, [continueAsGuest, router])

  return null
}