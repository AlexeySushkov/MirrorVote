import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Photo } from '@/integrations/supabase/types'

interface PhotoGridProps {
  photos: Photo[]
  onRemove?: (id: string) => void
  showRemove?: boolean
}

export function PhotoGrid({ photos, onRemove, showRemove = true }: PhotoGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted animate-fade-in"
        >
          <img
            src={photo.photo_url}
            alt={photo.original_filename}
            className="w-full h-full object-cover"
          />
          {showRemove && onRemove && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={() => onRemove(photo.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
