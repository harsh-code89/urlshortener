"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  buildShortUrl,
  clearCurrentSession,
  createLinkForUser,
  deleteLinkRecord,
  getCurrentSession,
  getUserLinks,
  type LinkRecord,
  recordClick,
} from "../../lib/app-storage"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [longUrl, setLongUrl] = useState("")
  const [shortCode, setShortCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [links, setLinks] = useState<LinkRecord[]>([])
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    const sessionUser = getCurrentSession()
    if (!sessionUser) {
      router.replace("/login")
      return
    }

    setUser(sessionUser)
    setLinks(getUserLinks(sessionUser.id))
  }, [router])

  const chartData = useMemo(
    () =>
      links
        .slice()
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((link) => ({
          name: link.shortCode,
          clicks: link.clicks,
        })),
    [links]
  )

  const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0)

  const handleCreateLink = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!user) return

    const result = createLinkForUser(user.id, longUrl, shortCode)
    if (!result.ok) {
      setError(result.message)
      return
    }

    setLongUrl("")
    setShortCode("")
    setLinks(getUserLinks(user.id))
  }

  const handleDelete = (linkId: string) => {
    if (!user) return
    deleteLinkRecord(user.id, linkId)
    setLinks(getUserLinks(user.id))
  }

  const handleCopy = async (shortCode: string) => {
    const url = buildShortUrl(shortCode)
    try {
      await navigator.clipboard.writeText(url)
      setCopiedCode(shortCode)
      window.setTimeout(() => setCopiedCode(null), 1500)
    } catch {
      setError("Copy failed. You can still copy the URL manually.")
    }
  }

  const handleOpen = (shortCode: string) => {
    const target = buildShortUrl(shortCode)
    window.open(target, "_blank", "noopener,noreferrer")
  }

  const handleLogout = () => {
    clearCurrentSession()
    router.push("/login")
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-indigo-400">Snip</p>
            <h1 className="mt-2 text-2xl font-bold">Welcome back, {user.email}</h1>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-600 hover:bg-zinc-700"
          >
            Log out
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Total links</p>
            <p className="mt-3 text-3xl font-bold">{links.length}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Total clicks</p>
            <p className="mt-3 text-3xl font-bold">{totalClicks}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Active profile</p>
            <p className="mt-3 text-lg font-semibold text-indigo-300">{user.email}</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="mb-4 text-xl font-semibold">Create a new short link</h2>

            {error && (
              <div className="mb-4 rounded-lg border border-red-700/60 bg-red-950/70 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateLink} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Destination URL</label>
                <input
                  type="url"
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Custom short code (optional)</label>
                <input
                  value={shortCode}
                  onChange={(e) => setShortCode(e.target.value)}
                  placeholder="summer-sale"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500"
              >
                Create short link
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="mb-4 text-xl font-semibold">Clicks by link</h2>
            <div className="h-56 w-full">
              {chartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#a1a1aa" />
                    <YAxis allowDecimals={false} stroke="#a1a1aa" />
                    <Tooltip wrapperStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 8 }} />
                    <Bar dataKey="clicks" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-700 text-sm text-zinc-500">
                  Your chart will appear once you create links.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Your links</h2>
            <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300">
              Home
            </Link>
          </div>

          <div className="space-y-3">
            {links.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-700 p-6 text-center text-zinc-400">
                No links yet. Create your first short URL to get started.
              </div>
            ) : (
              links.map((link) => {
                const shortUrl = buildShortUrl(link.shortCode)
                return (
                  <div key={link.id} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm text-zinc-400">Original</p>
                        <p className="mt-1 break-all text-sm text-zinc-200">{link.longUrl}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="rounded-full bg-indigo-500/20 px-2 py-1 text-xs font-medium text-indigo-300">
                            /{link.shortCode}
                          </span>
                          <span className="text-xs text-zinc-400">{link.clicks} clicks</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(link.shortCode)}
                          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-100 transition hover:bg-zinc-700"
                        >
                          {copiedCode === link.shortCode ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpen(link.shortCode)}
                          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-100 transition hover:bg-zinc-700"
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            recordClick(link.shortCode)
                            setLinks(getUserLinks(user.id))
                          }}
                          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-100 transition hover:bg-zinc-700"
                        >
                          Test click
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(link.id)}
                          className="rounded-lg border border-red-700/60 bg-red-950/40 px-3 py-2 text-sm text-red-200 transition hover:border-red-600 hover:bg-red-900/50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                      <span>Short URL</span>
                      <a href={shortUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300">
                        {shortUrl}
                      </a>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
