import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react'
import type { Photo } from '@/integrations/supabase/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface PhotoCardProps {
  photo: Photo
  showNormalized: boolean
  isBest?: boolean
  className?: string
  onPrev?: () => void
  onNext?: () => void
  onExpand?: () => void
  onHide?: () => void
  onShowAll?: () => void
}

export function PhotoCard({ photo, showNormalized, isBest, className, onPrev, onNext, onExpand, onHide, onShowAll }: PhotoCardProps) {
  const { t } = useLanguage()
  const [peekOriginal, setPeekOriginal] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const swipeStartX = useRef<number | null>(null)
  const swipeStartY = useRef<number | null>(null)
  const justSwiped = useRef(false)

  // Close on Escape
  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [fullscreen])

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    swipeStartX.current = touch.clientX
    swipeStartY.current = touch.clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartX.current === null || swipeStartY.current === null) return
    const touch = e.changedTouches[0]
    const dx = touch.clientX - swipeStartX.current
    const dy = touch.clientY - swipeStartY.current
    swipeStartX.current = null
    swipeStartY.current = null

    if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy)) return

    justSwiped.current = true
    setTimeout(() => { justSwiped.current = false }, 300)

    if (dx < 0) onNext?.()
    else onPrev?.()
  }

  const hasProcessed = Boolean(photo.processed_photo_url)
  const showingProcessed = showNormalized && hasProcessed && !peekOriginal
  const imgUrl = showingProcessed ? photo.processed_photo_url! : photo.photo_url
  const navigable = Boolean(onPrev || onNext)

  return (
    <>
      <div
        className={cn('relative rounded-xl overflow-hidden bg-muted group mx-auto w-fit', className)}
        style={{ touchAction: 'pan-y' }}
        onTouchStart={navigable ? handleTouchStart : undefined}
        onTouchEnd={navigable ? handleTouchEnd : undefined}
      >
        <img
          key={imgUrl}
          src={imgUrl}
          alt={photo.original_filename}
          className="block max-h-[calc(100svh-26rem)] max-w-full"
        />

        {/* Expand button — top-right, shown on hover */}
        <button
          type="button"
          className="absolute top-2 right-2 z-20 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1.5 text-xs text-white select-none touch-none"
          onClick={() => onExpand ? onExpand() : setFullscreen(true)}
          aria-label={t('photo.expand')}
        >
          <Maximize2 className="h-3.5 w-3.5" />
          {t('photo.expand')}
        </button>

        {navigable && (
          <>
            <button
              type="button"
              className="absolute inset-y-0 left-0 w-1/2 z-10 flex items-center justify-start pl-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => { if (!justSwiped.current) onPrev?.() }}
              aria-label="Previous"
            >
              <span className="rounded-full bg-black/40 p-1">
                <ChevronLeft className="h-5 w-5 text-white" />
              </span>
            </button>
            <button
              type="button"
              className="absolute inset-y-0 right-0 w-1/2 z-10 flex items-center justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => { if (!justSwiped.current) onNext?.() }}
              aria-label="Next"
            >
              <span className="rounded-full bg-black/40 p-1">
                <ChevronRight className="h-5 w-5 text-white" />
              </span>
            </button>
          </>
        )}
        {isBest && (
          <Badge variant="accent" className="absolute top-2 left-2">
            ★ AI Pick
          </Badge>
        )}
        {showNormalized && hasProcessed && (
          <button
            type="button"
            className="absolute bottom-2 right-2 z-20 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1.5 text-xs text-white select-none touch-none"
            onPointerDown={() => setPeekOriginal(true)}
            onPointerUp={() => setPeekOriginal(false)}
            onPointerLeave={() => setPeekOriginal(false)}
          >
            <Eye className="h-3.5 w-3.5" />
            Original
          </button>
        )}
        {onShowAll ? (
          <button
            type="button"
            className="absolute bottom-2 left-2 z-20 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1.5 text-xs text-white select-none touch-none"
            onClick={onShowAll}
          >
            <Eye className="h-3.5 w-3.5" />
            {t('compare.showAll')}
          </button>
        ) : onHide ? (
          <button
            type="button"
            className="absolute bottom-2 left-2 z-20 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1.5 text-xs text-white select-none touch-none"
            onClick={onHide}
          >
            <EyeOff className="h-3.5 w-3.5" />
            {t('compare.hidePhoto')}
          </button>
        ) : null}
      </div>

      {/* Fullscreen lightbox */}
      {fullscreen && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={(e) => { if (e.target === e.currentTarget) setFullscreen(false) }}
        >
          <div
            className="relative flex items-center justify-center w-full h-full p-4"
            style={{ touchAction: 'pan-y' }}
            onTouchStart={navigable ? handleTouchStart : undefined}
            onTouchEnd={navigable ? handleTouchEnd : undefined}
          >
            <img
              key={imgUrl + '-fs'}
              src={imgUrl}
              alt={photo.original_filename}
              className="max-h-[100svh] max-w-[100vw] object-contain rounded-xl pointer-events-none"
            />

            {/* Collapse button — top-right */}
            <button
              type="button"
              className="absolute top-4 right-4 z-20 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1.5 text-xs text-white select-none"
              onClick={() => setFullscreen(false)}
              aria-label={t('photo.collapse')}
            >
              <Minimize2 className="h-3.5 w-3.5" />
              {t('photo.collapse')}
            </button>

            {/* Navigation arrows */}
            {navigable && (
              <>
                <button
                  type="button"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/50 p-2"
                  onClick={() => { if (!justSwiped.current) onPrev?.() }}
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </button>
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/50 p-2"
                  onClick={() => { if (!justSwiped.current) onNext?.() }}
                  aria-label="Next"
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </button>
              </>
            )}

            {/* Best badge */}
            {isBest && (
              <Badge variant="accent" className="absolute top-4 left-4">
                ★ AI Pick
              </Badge>
            )}

            {/* Original peek */}
            {showNormalized && hasProcessed && (
              <button
                type="button"
                className="absolute bottom-4 right-4 z-20 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1.5 text-xs text-white select-none touch-none"
                onPointerDown={() => setPeekOriginal(true)}
                onPointerUp={() => setPeekOriginal(false)}
                onPointerLeave={() => setPeekOriginal(false)}
              >
                <Eye className="h-3.5 w-3.5" />
                Original
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
