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
    if (payload && typeof payload === 'object' && 'error' in payload) {
      const message = String((payload as { error?: unknown }).error ?? '').trim()
      if (message) return new Error(message)
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
