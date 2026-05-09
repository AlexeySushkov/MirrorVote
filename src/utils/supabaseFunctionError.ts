export async function toFunctionError(error: unknown): Promise<Error> {
  if (!(error instanceof Error)) {
    return new Error('Unknown error')
  }

  const maybeWithContext = error as Error & { context?: { json?: () => Promise<unknown>; text?: () => Promise<string> } }
  const context = maybeWithContext.context
  if (!context) {
    return error
  }

  try {
    const payload = await context.json?.()
    if (payload && typeof payload === 'object') {
      const payloadObj = payload as { error?: unknown; code?: unknown; quota?: unknown }
      if ('error' in payloadObj) {
        const message = String(payloadObj.error ?? '').trim()
        if (message) {
          const result = new Error(message) as Error & { code?: string; quota?: unknown }
          if (typeof payloadObj.code === 'string') result.code = payloadObj.code
          if (payloadObj.quota !== undefined) result.quota = payloadObj.quota
          return result
        }
      }
    }
  } catch {
    // Ignore JSON parse errors and try plain text fallback
  }

  try {
    const text = (await context.text?.())?.trim()
    if (text) return new Error(text)
  } catch {
    // Ignore text read errors and keep original message
  }

  return error
}
