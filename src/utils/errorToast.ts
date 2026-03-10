import { toast } from 'sonner'

function getErrorMessage(error: unknown, fallbackMessage: string): string {
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
