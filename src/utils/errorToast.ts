import { toast } from 'sonner'

export function isNetworkError(error: unknown): boolean {
  if (!navigator.onLine) return true
  if (!(error instanceof Error)) return false
  const msg = error.message.toLowerCase()
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg === 'fetch failed'
  )
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (isNetworkError(error)) return 'Нет подключения к интернету'
  if (typeof error === 'string') return error
  if (error instanceof Error && error.message.trim()) return error.message
  return fallbackMessage
}

export function showErrorToast(
  error: unknown,
  fallbackMessage: string,
  context: string
): void {
  const message = getErrorMessage(error, fallbackMessage)
  console.error(`[${context}]`, error)
  toast.error(message)
}
