// Decides whether to offer Google sign-in. Google is hidden for users in Russia
// (406-ФЗ: Russian sites must authenticate users via Russian identity providers).
// Country comes from /app/geo.json (nginx + GeoIP, optional); if unavailable,
// we fall back to the browser timezone.

export const RU_TIMEZONES = new Set([
  'Europe/Kaliningrad',
  'Europe/Moscow',
  'Europe/Simferopol',
  'Europe/Kirov',
  'Europe/Volgograd',
  'Europe/Astrakhan',
  'Europe/Saratov',
  'Europe/Ulyanovsk',
  'Europe/Samara',
  'Asia/Yekaterinburg',
  'Asia/Omsk',
  'Asia/Novosibirsk',
  'Asia/Barnaul',
  'Asia/Tomsk',
  'Asia/Novokuznetsk',
  'Asia/Krasnoyarsk',
  'Asia/Irkutsk',
  'Asia/Chita',
  'Asia/Yakutsk',
  'Asia/Khandyga',
  'Asia/Vladivostok',
  'Asia/Ust-Nera',
  'Asia/Magadan',
  'Asia/Sakhalin',
  'Asia/Srednekolymsk',
  'Asia/Kamchatka',
  'Asia/Anadyr',
])

export const GOOGLE_USED_KEY = 'mv:usedGoogleAuth'
const GEO_TIMEOUT_MS = 2000

const normalizeCountry = (value: unknown): string | null =>
  typeof value === 'string' && /^[A-Za-z]{2}$/.test(value) ? value.toUpperCase() : null

export async function fetchCountry(): Promise<string | null> {
  const override = normalizeCountry(import.meta.env.VITE_GEO_COUNTRY)
  if (override) return override

  try {
    const signal = typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(GEO_TIMEOUT_MS) : undefined
    const res = await fetch(`${import.meta.env.BASE_URL}geo.json`, { cache: 'no-store', signal })
    if (!res.ok) return null
    // Without the nginx location, the SPA fallback returns index.html — res.json() throws.
    const data: unknown = await res.json()
    return normalizeCountry((data as { country?: unknown } | null)?.country)
  } catch {
    return null
  }
}

export function getBrowserTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return undefined
  }
}

export const isRussianTimezone = (tz?: string): boolean => Boolean(tz && RU_TIMEZONES.has(tz))

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=')))
  } catch {
    return null
  }
}

// True only if the *current* session was obtained via Google OAuth.
// `user.identities` isn't enough: Supabase auto-links a Google identity to an
// email/password account with the same email, so it shows up on password sign-ins too.
export function isGoogleSession(
  session: { access_token: string; user: { identities?: { provider: string }[] } } | null | undefined,
): boolean {
  if (!session) return false
  const amr = decodeJwtPayload(session.access_token)?.amr
  const viaOAuth = Array.isArray(amr) && amr.some((e) => (e as { method?: unknown })?.method === 'oauth')
  return viaOAuth && Boolean(session.user.identities?.some((i) => i.provider === 'google'))
}

export function markGoogleUsed(): void {
  try {
    localStorage.setItem(GOOGLE_USED_KEY, '1')
  } catch {
    // storage unavailable (private mode) — ignore
  }
}

export function hasUsedGoogle(): boolean {
  try {
    return localStorage.getItem(GOOGLE_USED_KEY) === '1'
  } catch {
    return false
  }
}

export function shouldShowGoogle({
  country,
  timezone,
  usedGoogle,
}: {
  country: string | null
  timezone?: string
  usedGoogle: boolean
}): boolean {
  if (usedGoogle) return true
  if (country) return country !== 'RU'
  return !isRussianTimezone(timezone)
}
