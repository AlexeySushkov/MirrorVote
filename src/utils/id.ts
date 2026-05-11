export function makeClientId(): string {
  const c = globalThis.crypto as (Crypto & { randomUUID?: () => string }) | undefined
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}
