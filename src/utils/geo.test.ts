import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  GOOGLE_USED_KEY,
  fetchCountry,
  hasUsedGoogle,
  isRussianTimezone,
  markGoogleUsed,
  shouldShowGoogle,
} from './geo'

describe('isRussianTimezone', () => {
  it('detects Russian timezones', () => {
    expect(isRussianTimezone('Europe/Moscow')).toBe(true)
    expect(isRussianTimezone('Asia/Vladivostok')).toBe(true)
  })

  it('rejects other or missing timezones', () => {
    expect(isRussianTimezone('Europe/Berlin')).toBe(false)
    expect(isRussianTimezone('Europe/Minsk')).toBe(false)
    expect(isRussianTimezone(undefined)).toBe(false)
  })
})

describe('shouldShowGoogle', () => {
  it('always shows when Google was used before', () => {
    expect(shouldShowGoogle({ country: 'RU', timezone: 'Europe/Moscow', usedGoogle: true })).toBe(true)
  })

  it('uses the IP country when known, ignoring timezone', () => {
    expect(shouldShowGoogle({ country: 'RU', timezone: 'Europe/Berlin', usedGoogle: false })).toBe(false)
    expect(shouldShowGoogle({ country: 'DE', timezone: 'Europe/Moscow', usedGoogle: false })).toBe(true)
  })

  it('falls back to timezone when country is unknown', () => {
    expect(shouldShowGoogle({ country: null, timezone: 'Europe/Moscow', usedGoogle: false })).toBe(false)
    expect(shouldShowGoogle({ country: null, timezone: 'America/New_York', usedGoogle: false })).toBe(true)
    expect(shouldShowGoogle({ country: null, timezone: undefined, usedGoogle: false })).toBe(true)
  })
})

describe('fetchCountry', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  const stubFetch = (impl: () => Promise<unknown>) => {
    const fetchMock = vi.fn(impl)
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  it('returns the country from geo.json', async () => {
    const fetchMock = stubFetch(async () => new Response('{"country":"de"}'))
    await expect(fetchCountry()).resolves.toBe('DE')
    expect(fetchMock).toHaveBeenCalledWith(`${import.meta.env.BASE_URL}geo.json`, expect.objectContaining({ cache: 'no-store' }))
  })

  it('returns null when nginx serves index.html instead of JSON', async () => {
    stubFetch(async () => new Response('<!doctype html><html></html>'))
    await expect(fetchCountry()).resolves.toBeNull()
  })

  it('returns null for an empty country', async () => {
    stubFetch(async () => new Response('{"country":""}'))
    await expect(fetchCountry()).resolves.toBeNull()
  })

  it('returns null on non-OK response', async () => {
    stubFetch(async () => new Response('', { status: 404 }))
    await expect(fetchCountry()).resolves.toBeNull()
  })

  it('returns null on network error or timeout', async () => {
    stubFetch(async () => {
      throw new DOMException('timed out', 'TimeoutError')
    })
    await expect(fetchCountry()).resolves.toBeNull()
  })

  it('prefers VITE_GEO_COUNTRY override without fetching', async () => {
    vi.stubEnv('VITE_GEO_COUNTRY', 'ru')
    const fetchMock = stubFetch(async () => new Response('{"country":"DE"}'))
    await expect(fetchCountry()).resolves.toBe('RU')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('Google usage marker', () => {
  let store: Record<string, string>

  beforeEach(() => {
    store = {}
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is false until marked', () => {
    expect(hasUsedGoogle()).toBe(false)
    markGoogleUsed()
    expect(store[GOOGLE_USED_KEY]).toBe('1')
    expect(hasUsedGoogle()).toBe(true)
  })

  it('does not throw when storage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('denied')
      },
    })
    expect(() => markGoogleUsed()).not.toThrow()
    expect(hasUsedGoogle()).toBe(false)
  })
})
