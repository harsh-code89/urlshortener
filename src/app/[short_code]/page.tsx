"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getLinkByCode, recordClick } from "../../lib/app-storage"

export default function ShortLinkRedirect() {
  const params = useParams()
  const router = useRouter()

  useEffect(() => {
    const shortCode = Array.isArray(params.short_code) ? params.short_code[0] : params.short_code
    const link = getLinkByCode(shortCode ?? "")

    if (!link) {
      router.replace("/login")
      return
    }

    recordClick(shortCode)
    window.location.href = link.longUrl
  }, [params, router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
      <p className="text-sm text-zinc-400">Redirecting...</p>
    </main>
  )
}
