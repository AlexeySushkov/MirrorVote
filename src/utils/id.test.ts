import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeClientId } from './id'

describe('makeClientId', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns a UUID when crypto.randomUUID is available', () => {
    expect(makeClientId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('returns unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, makeClientId))
    expect(ids.size).toBe(100)
  })

  it('falls back to a timestamp-based id without crypto.randomUUID', () => {
    vi.stubGlobal('crypto', {})
    expect(makeClientId()).toMatch(/^\d+-[0-9a-f]+$/)
  })
})
