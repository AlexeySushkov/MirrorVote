import { createPortal } from 'react-dom'
import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Minimize2, Eye } from 'lucide-react'
import { PhotoCard } from './PhotoCard'
import { Badge } from '@/components/ui/badge'
import type { Photo } from '@/integrations/supabase/types'
import { useLanguage } from '@/contexts/LanguageContext'

interface CarouselViewProps {
  photos: Photo[]
  showNormalized: boolean
  bestPhotoId?: string | null
  onSlideChange?: (index: number) => void
}

export function CarouselView({ photos, showNormalized, bestPhotoId, onSlideChange }: CarouselViewProps) {
  const { t } = useLanguage()
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [peekOriginal, setPeekOriginal] = useState(false)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())

  const visiblePhotos = photos.filter(p => !hiddenIds.has(p.id))

  const handleHide = useCallback((photoId: string) => {
    setHiddenIds(prev => new Set([...prev, photoId]))
  }, [])

  const handleShowAll = useCallback(() => {
    setHiddenIds(new Set())
  }, [])

  // Reinit embla and clamp index when visible photos change
  useEffect(() => {
    if (!emblaApi) return
    emblaApi.reInit()
    const maxIdx = Math.max(0, visiblePhotos.length - 1)
    emblaApi.scrollTo(Math.min(selectedIndex, maxIdx), true)
  }, [hiddenIds, emblaApi])

  const swipeStartX = useRef<number | null>(null)
  const swipeStartY = useRef<number | null>(null)
  const justSwiped = useRef(false)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    const idx = emblaApi.selectedScrollSnap()
    setSelectedIndex(idx)
    onSlideChange?.(idx)
  }, [emblaApi, onSlideChange])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  // Close fullscreen on Escape
  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [fullscreen])

  // Reset peekOriginal when slide changes in fullscreen
  useEffect(() => {
    setPeekOriginal(false)
  }, [selectedIndex])

  // Touch/swipe handlers for fullscreen overlay
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

    if (dx < 0) emblaApi?.scrollNext()
    else emblaApi?.scrollPrev()
  }

  const currentPhoto = visiblePhotos[selectedIndex] ?? visiblePhotos[0]
  const hasProcessed = Boolean(currentPhoto?.processed_photo_url)
  const showingProcessed = showNormalized && hasProcessed && !peekOriginal
  const imgUrl = showingProcessed ? currentPhoto?.processed_photo_url! : currentPhoto?.photo_url

  return (
    <>
      <div className="overflow-hidden">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-4">
            {visiblePhotos.map((photo) => (
              <div key={photo.id} className="flex-[0_0_80%] min-w-0">
                <PhotoCard
                  photo={photo}
                  showNormalized={showNormalized}
                  isBest={photo.id === bestPhotoId}
                  onPrev={() => emblaApi?.scrollPrev()}
                  onNext={() => emblaApi?.scrollNext()}
                  onExpand={() => setFullscreen(true)}
                  onHide={visiblePhotos.length > 1 ? () => handleHide(photo.id) : undefined}
                  onShowAll={visiblePhotos.length === 1 && photos.length > 1 ? handleShowAll : undefined}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center gap-1 mt-4">
          {visiblePhotos.map((_, i) => (
            <button
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === selectedIndex ? 'bg-primary' : 'bg-muted'
              }`}
              onClick={() => emblaApi?.scrollTo(i)}
            />
          ))}
        </div>
      </div>

      {/* Fullscreen overlay — owned by CarouselView so it always shows photos[selectedIndex] */}
      {fullscreen && currentPhoto && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={(e) => { if (e.target === e.currentTarget) setFullscreen(false) }}
        >
          <div
            className="relative flex items-center justify-center w-full h-full p-4"
            style={{ touchAction: 'pan-y' }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              key={imgUrl}
              src={imgUrl}
              alt={currentPhoto.original_filename}
              className="max-h-[100svh] max-w-[100vw] object-contain rounded-xl pointer-events-none"
            />

            {/* Collapse button */}
            <button
              type="button"
              className="absolute top-4 right-4 z-20 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1.5 text-xs text-white select-none"
              onClick={() => setFullscreen(false)}
              aria-label={t('photo.collapse')}
            >
              <Minimize2 className="h-3.5 w-3.5" />
              {t('photo.collapse')}
            </button>

            {/* Prev arrow */}
            <button
              type="button"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/50 p-2"
              onClick={() => { if (!justSwiped.current) emblaApi?.scrollPrev() }}
              aria-label="Previous"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>

            {/* Next arrow */}
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/50 p-2"
              onClick={() => { if (!justSwiped.current) emblaApi?.scrollNext() }}
              aria-label="Next"
            >
              <ChevronRight className="h-6 w-6 text-white" />
            </button>

            {/* Best badge */}
            {bestPhotoId === currentPhoto.id && (
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

            {/* Slide counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
              {visiblePhotos.map((_, i) => (
                <button
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === selectedIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                  onClick={() => emblaApi?.scrollTo(i)}
                  aria-label={`Photo ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
