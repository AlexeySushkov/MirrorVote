import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PhotoCard } from './PhotoCard'
import type { Photo } from '@/integrations/supabase/types'

interface SideBySideProps {
  photos: Photo[]
  showNormalized: boolean
  bestPhotoId?: string | null
  leftIndex: number
  onLeftIndexChange: (i: number) => void
}

export function SideBySide({
  photos,
  showNormalized,
  bestPhotoId,
  leftIndex,
  onLeftIndexChange,
}: SideBySideProps) {
  const rightIndex = (leftIndex + 1) % photos.length
  const left = photos[leftIndex]
  const right = photos[rightIndex]

  if (!left || !right) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <PhotoCard
          photo={left}
          showNormalized={showNormalized}
          isBest={left.id === bestPhotoId}
        />
        <PhotoCard
          photo={right}
          showNormalized={showNormalized}
          isBest={right.id === bestPhotoId}
        />
      </div>
      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onLeftIndexChange((leftIndex - 1 + photos.length) % photos.length)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground self-center">
          {leftIndex + 1} / {photos.length}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onLeftIndexChange((leftIndex + 1) % photos.length)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
