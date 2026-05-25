import { useRegisterSW } from 'virtual:pwa-register/react'

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

  if (!needRefresh) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#1c1c1e',
        color: '#fff',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.3)',
      }}
    >
      <span style={{ fontSize: '14px' }}>
        Доступна новая версия
      </span>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          background: '#e05c7e',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 20px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          flexShrink: 0,
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}
      >
        Обновить
      </button>
    </div>
  )
}
