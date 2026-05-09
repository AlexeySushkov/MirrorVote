export function makeClientId(): string {
  const maybeRandomUUID = (globalThis.crypto as Crypto & { randomUUID?: () => string } | undefined)?.randomUUID
  if (typeof maybeRandomUUID === 'function') {
    return maybeRandomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}
