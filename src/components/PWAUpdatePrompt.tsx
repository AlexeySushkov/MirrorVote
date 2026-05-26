import { useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function PWAUpdatePrompt() {
  const [loading, setLoading] = useState(false)
  const [pressed, setPressed] = useState(false)

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

  const handleUpdate = () => {
    if (loading) return
    setLoading(true)
    setPressed(false)

    // Собственный listener на controllerchange — срабатывает когда новый SW
    // берёт контроль над страницей после skipWaiting
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => window.location.reload(),
      { once: true },
    )

    // Жёсткий fallback: перезагрузка через 3 с в любом случае.
    // НЕ очищаем — multiple reload() безвредны, первый побеждает.
    setTimeout(() => window.location.reload(), 3000)

    // Сигнализируем ждущему SW сделать skipWaiting
    updateServiceWorker(true).catch(() => window.location.reload())
  }

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
        padding: '16px 16px calc(16px + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.3)',
      }}
    >
      <span style={{ fontSize: '14px' }}>Доступна новая версия</span>
      <button
        onClick={handleUpdate}
        onPointerDown={() => !loading && setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        style={{
          background: pressed ? '#b8405f' : loading ? '#a04060' : '#e05c7e',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 20px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: loading ? 'default' : 'pointer',
          flexShrink: 0,
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
          transform: pressed ? 'scale(0.94)' : 'scale(1)',
          transition: 'transform 0.08s ease, background 0.08s ease',
          opacity: loading ? 0.7 : 1,
          // НЕ используем disabled — он блокирует pointer-события и ломает pressed-анимацию
          pointerEvents: loading ? 'none' : 'auto',
        }}
      >
        {loading ? '…' : 'Обновить'}
      </button>
    </div>
  )
}
