import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { toast } from 'sonner'

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Проверять обновления раз в час, пока вкладка открыта
      if (r) setInterval(() => void r.update(), 60 * 60 * 1000)
    },
    onRegisterError(err) {
      console.warn('SW registration error', err)
    },
  })

  useEffect(() => {
    if (!needRefresh) return
    toast('Доступна новая версия', {
      description: 'Нажмите «Обновить», чтобы применить изменения',
      duration: Infinity,
      action: {
        label: 'Обновить',
        onClick: () => updateServiceWorker(true),
      },
    })
  }, [needRefresh, updateServiceWorker])

  return null
}
