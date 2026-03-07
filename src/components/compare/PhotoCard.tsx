import { getNormalizationStyles } from '@/utils/normalizationUtils'
import type { Photo } from '@/integrations/supabase/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PhotoCardProps {
  photo: Photo
  showNormalized: boolean
  isBest?: boolean
  className?: string
}

export function PhotoCard({ photo, showNormalized, isBest, className }: PhotoCardProps) {
  const styles = showNormalized && photo.normalization
    ? getNormalizationStyles(photo.normalization)
    : {}

  return (
    <div className={cn('relative rounded-xl overflow-hidden bg-muted', className)}>
      <div className="aspect-[3/4] relative" style={styles}>
        <img
          src={photo.photo_url}
          alt={photo.original_filename}
          className="w-full h-full object-cover object-center"
        />
      </div>
      {isBest && (
        <Badge variant="accent" className="absolute top-2 left-2">
          ★ AI Pick
        </Badge>
      )}
    </div>
  )
}
