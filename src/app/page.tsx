'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentSession } from '../lib/app-storage'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const session = getCurrentSession()
    router.replace(session ? '/dashboard' : '/login')
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
      <p className="text-sm text-zinc-400">Redirecting...</p>
    </main>
  )
}
