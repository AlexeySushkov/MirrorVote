import { Slider } from '@/components/ui/slider'
import { PhotoCard } from './PhotoCard'
import type { Photo } from '@/integrations/supabase/types'

interface OverlayViewProps {
  photos: Photo[]
  showNormalized: boolean
  bestPhotoId?: string | null
  opacity: number
  onOpacityChange: (v: number) => void
  leftIndex: number
  rightIndex: number
}

export function OverlayView({
  photos,
  showNormalized,
  bestPhotoId,
  opacity,
  onOpacityChange,
  leftIndex,
  rightIndex,
}: OverlayViewProps) {
  const left = photos[leftIndex]
  const right = photos[rightIndex]
  if (!left || !right) return null

  return (
    <div className="space-y-4">
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted">
        <div className="absolute inset-0">
          <PhotoCard
            photo={left}
            showNormalized={showNormalized}
            isBest={left.id === bestPhotoId}
            className="absolute inset-0"
          />
        </div>
        <div
          className="absolute inset-0"
          style={{ opacity }}
        >
          <PhotoCard
            photo={right}
            showNormalized={showNormalized}
            isBest={right.id === bestPhotoId}
            className="absolute inset-0"
          />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Прозрачность: {Math.round(opacity * 100)}%</p>
        <Slider
          value={[opacity]}
          onValueChange={([v]) => onOpacityChange(v ?? 0.5)}
          max={1}
          min={0}
          step={0.01}
        />
      </div>
    </div>
  )
}
