import { useState } from 'react'
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import type { Photo } from '@/integrations/supabase/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PhotoCardProps {
  photo: Photo
  showNormalized: boolean
  isBest?: boolean
  className?: string
  onPrev?: () => void
  onNext?: () => void
}

export function PhotoCard({ photo, showNormalized, isBest, className, onPrev, onNext }: PhotoCardProps) {
  const [peekOriginal, setPeekOriginal] = useState(false)

  const hasProcessed = Boolean(photo.processed_photo_url)
  const showingProcessed = showNormalized && hasProcessed && !peekOriginal
  const imgUrl = showingProcessed ? photo.processed_photo_url! : photo.photo_url
  const navigable = Boolean(onPrev || onNext)

  return (
    <div className={cn('relative rounded-xl overflow-hidden bg-muted group', className)}>
      <div className="aspect-[3/4] relative">
        <img
          src={imgUrl}
          alt={photo.original_filename}
          className="w-full h-full object-cover object-center"
        />
        {navigable && (
          <>
            <button
              type="button"
              className="absolute inset-y-0 left-0 w-1/2 z-10 flex items-center justify-start pl-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onPrev}
              aria-label="Previous"
            >
              <span className="rounded-full bg-black/40 p-1">
                <ChevronLeft className="h-5 w-5 text-white" />
              </span>
            </button>
            <button
              type="button"
              className="absolute inset-y-0 right-0 w-1/2 z-10 flex items-center justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onNext}
              aria-label="Next"
            >
              <span className="rounded-full bg-black/40 p-1">
                <ChevronRight className="h-5 w-5 text-white" />
              </span>
            </button>
          </>
        )}
      </div>
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
    </div>
  )
}
