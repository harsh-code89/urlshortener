export type AppUser = {
  id: string
  email: string
  password: string
  createdAt: string
}

export type LinkRecord = {
  id: string
  userId: string
  shortCode: string
  longUrl: string
  custom: boolean
  createdAt: string
  clicks: number
}

const USERS_KEY = 'snip-users'
const SESSION_KEY = 'snip-session'
const LINKS_KEY = 'snip-links'

function parse<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback

  try {
    const value = window.localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function normalizeUrl(url: string) {
  const trimmed = url.trim()
  if (!trimmed) return ''

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    return new URL(withProtocol).toString()
  } catch {
    return ''
  }
}

export function generateShortCode(customValue?: string) {
  const candidate = (customValue || '').trim().toLowerCase()
  if (candidate) return candidate.replace(/[^a-z0-9-]/g, '').slice(0, 12) || ''

  return Math.random().toString(36).slice(2, 8)
}

export function getStoredUsers(): AppUser[] {
  return parse<AppUser[]>(USERS_KEY, [])
}

export function getCurrentSession(): AppUser | null {
  const sessionEmail = parse<string | null>(SESSION_KEY, null)
  if (!sessionEmail) return null

  const users = getStoredUsers()
  return users.find((user) => user.email.toLowerCase() === sessionEmail.toLowerCase()) ?? null
}

export function setCurrentSession(email: string) {
  write(SESSION_KEY, email)
}

export function clearCurrentSession() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(SESSION_KEY)
}

export function signUpUser(email: string, password: string) {
  const trimmedEmail = email.trim().toLowerCase()
  if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { ok: false, message: 'Please enter a valid email address.' }
  }

  if (password.length < 8) {
    return { ok: false, message: 'Password must be at least 8 characters long.' }
  }

  const users = getStoredUsers()
  if (users.some((user) => user.email.toLowerCase() === trimmedEmail)) {
    return { ok: false, message: 'An account with this email already exists.' }
  }

  const user: AppUser = {
    id: makeId('user'),
    email: trimmedEmail,
    password,
    createdAt: new Date().toISOString(),
  }

  users.push(user)
  write(USERS_KEY, users)
  setCurrentSession(trimmedEmail)

  return { ok: true, user }
}

export function signInUser(email: string, password: string) {
  const trimmedEmail = email.trim().toLowerCase()
  const users = getStoredUsers()
  const match = users.find(
    (user) => user.email.toLowerCase() === trimmedEmail && user.password === password
  )

  if (!match) {
    return { ok: false, message: 'Invalid email or password.' }
  }

  setCurrentSession(trimmedEmail)
  return { ok: true, user: match }
}

export function getUserLinks(userId: string): LinkRecord[] {
  const allLinks = parse<LinkRecord[]>(LINKS_KEY, [])
  return allLinks.filter((record) => record.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function createLinkForUser(userId: string, longUrl: string, customShortCode?: string) {
  const normalizedUrl = normalizeUrl(longUrl)
  if (!normalizedUrl) {
    return { ok: false, message: 'Enter a valid URL to shorten.' }
  }

  const code = generateShortCode(customShortCode)
  if (!code) {
    return { ok: false, message: 'Short code is invalid. Use letters, numbers, or dashes only.' }
  }

  const allLinks = parse<LinkRecord[]>(LINKS_KEY, [])
  if (allLinks.some((record) => record.shortCode === code)) {
    return { ok: false, message: 'That short code is already in use. Please choose another one.' }
  }

  const record: LinkRecord = {
    id: makeId('link'),
    userId,
    shortCode: code,
    longUrl: normalizedUrl,
    custom: Boolean(customShortCode && customShortCode.trim()),
    createdAt: new Date().toISOString(),
    clicks: 0,
  }

  allLinks.push(record)
  write(LINKS_KEY, allLinks)

  return { ok: true, link: record }
}

export function getLinkByCode(shortCode: string): LinkRecord | null {
  const allLinks = parse<LinkRecord[]>(LINKS_KEY, [])
  return allLinks.find((record) => record.shortCode === shortCode.toLowerCase()) ?? null
}

export function recordClick(shortCode: string) {
  const allLinks = parse<LinkRecord[]>(LINKS_KEY, [])
  const matchIndex = allLinks.findIndex((record) => record.shortCode === shortCode.toLowerCase())

  if (matchIndex === -1) return null

  allLinks[matchIndex] = {
    ...allLinks[matchIndex],
    clicks: (allLinks[matchIndex].clicks ?? 0) + 1,
  }

  write(LINKS_KEY, allLinks)
  return allLinks[matchIndex]
}

export function deleteLinkRecord(userId: string, linkId: string) {
  const allLinks = parse<LinkRecord[]>(LINKS_KEY, [])
  const filtered = allLinks.filter((record) => record.id !== linkId || record.userId !== userId)
  write(LINKS_KEY, filtered)
  return filtered
}

export function buildShortUrl(shortCode: string) {
  if (typeof window === 'undefined') return `/` + shortCode
  return `${window.location.origin}/${shortCode}`
}
