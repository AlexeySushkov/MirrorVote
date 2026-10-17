import { describe, expect, it } from 'vitest'
import { toFunctionError } from './supabaseFunctionError'

function errorWithContext(context: { json?: () => Promise<unknown>; text?: () => Promise<string> }) {
  return Object.assign(new Error('Edge Function returned a non-2xx status code'), { context })
}

describe('toFunctionError', () => {
  it('wraps non-Error values', async () => {
    const result = await toFunctionError('boom')
    expect(result.message).toBe('Unknown error')
  })

  it('returns the original error when there is no context', async () => {
    const original = new Error('network down')
    expect(await toFunctionError(original)).toBe(original)
  })

  it('extracts message, code and quota from JSON payload', async () => {
    const quota = { used: 3, limit_count: 3 }
    const result = (await toFunctionError(
      errorWithContext({ json: async () => ({ error: 'Limit reached', code: 'QUOTA_EXCEEDED', quota }) }),
    )) as Error & { code?: string; quota?: unknown }

    expect(result.message).toBe('Limit reached')
    expect(result.code).toBe('QUOTA_EXCEEDED')
    expect(result.quota).toEqual(quota)
  })

  it('falls back to plain text when JSON parsing fails', async () => {
    const result = await toFunctionError(
      errorWithContext({
        json: async () => {
          throw new SyntaxError('bad json')
        },
        text: async () => '  Gateway timeout  ',
      }),
    )
    expect(result.message).toBe('Gateway timeout')
  })

  it('keeps the original error when payload has an empty message', async () => {
    const original = errorWithContext({ json: async () => ({ error: '   ' }), text: async () => '' })
    expect(await toFunctionError(original)).toBe(original)
  })
})
