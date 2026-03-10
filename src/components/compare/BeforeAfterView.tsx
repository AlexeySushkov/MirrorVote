import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Photo } from '@/integrations/supabase/types'

interface BeforeAfterViewProps {
  photos: Photo[]
  bestPhotoId?: string | null
  index: number
  onIndexChange: (i: number) => void
}

export function BeforeAfterView({
  photos,
  bestPhotoId,
  index,
  onIndexChange,
}: BeforeAfterViewProps) {
  const [splitPercent, setSplitPercent] = useState(50)
  const photo = photos[index]
  const hasProcessed = Boolean(photo?.processed_photo_url)
  const navigable = photos.length > 1

  const goPrev = useCallback(
    () => onIndexChange((index - 1 + photos.length) % photos.length),
    [index, photos.length, onIndexChange]
  )
  const goNext = useCallback(
    () => onIndexChange((index + 1) % photos.length),
    [index, photos.length, onIndexChange]
  )

  if (!photo) return null

  return (
    <div className="space-y-4">
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted group">
        <img
          src={photo.photo_url}
          alt={`${photo.original_filename} original`}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - splitPercent}% 0 0)` }}
        >
          <img
            src={photo.processed_photo_url ?? photo.photo_url}
            alt={`${photo.original_filename} Simple Look`}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </div>

        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary/90 pointer-events-none"
          style={{ left: `${splitPercent}%` }}
        />

        {navigable && (
          <>
            <button
              type="button"
              className="absolute inset-y-0 left-0 w-[15%] z-10 flex items-center justify-start pl-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goPrev}
              aria-label="Previous"
            >
              <span className="rounded-full bg-black/40 p-1">
                <ChevronLeft className="h-5 w-5 text-white" />
              </span>
            </button>
            <button
              type="button"
              className="absolute inset-y-0 right-0 w-[15%] z-10 flex items-center justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goNext}
              aria-label="Next"
            >
              <span className="rounded-full bg-black/40 p-1">
                <ChevronRight className="h-5 w-5 text-white" />
              </span>
            </button>
          </>
        )}

        <div className="absolute top-2 left-2 rounded bg-black/55 px-2 py-1 text-xs text-white pointer-events-none">
          Original
        </div>
        <div className="absolute top-2 right-2 rounded bg-black/55 px-2 py-1 text-xs text-white pointer-events-none">
          {hasProcessed ? 'Simple Look' : 'Simple Look (run first)'}
        </div>
        {photo.id === bestPhotoId && (
          <div className="absolute bottom-2 left-2 rounded bg-accent px-2 py-1 text-xs text-accent-foreground pointer-events-none">
            AI Pick
          </div>
        )}
      </div>

      <div className="space-y-2">
        <input
          type="range"
          min={0}
          max={100}
          value={splitPercent}
          onChange={(e) => setSplitPercent(Number(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground text-center">
          Move slider to compare original vs Simple Look
        </p>
      </div>

      {photos.length > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onIndexChange((index - 1 + photos.length) % photos.length)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground self-center">
            {index + 1} / {photos.length}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onIndexChange((index + 1) % photos.length)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
