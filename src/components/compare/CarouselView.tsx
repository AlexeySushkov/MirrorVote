import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useState } from 'react'
import { PhotoCard } from './PhotoCard'
import type { Photo } from '@/integrations/supabase/types'

interface CarouselViewProps {
  photos: Photo[]
  showNormalized: boolean
  bestPhotoId?: string | null
}

export function CarouselView({ photos, showNormalized, bestPhotoId }: CarouselViewProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  return (
    <div className="overflow-hidden">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="flex-[0_0_80%] min-w-0">
              <PhotoCard
                photo={photo}
                showNormalized={showNormalized}
                isBest={photo.id === bestPhotoId}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-1 mt-4">
        {photos.map((_, i) => (
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
  )
}
