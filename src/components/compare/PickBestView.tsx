import { useState, useCallback, useEffect } from 'react'
import { X, RotateCcw, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PhotoCard } from './PhotoCard'
import type { Photo } from '@/integrations/supabase/types'
import { useLanguage } from '@/contexts/LanguageContext'

interface PickBestViewProps {
  photos: Photo[]
  showNormalized: boolean
  bestPhotoId?: string | null
  onCurrentPhotoChange?: (photo: Photo) => void
}

export function PickBestView({ photos, showNormalized, bestPhotoId, onCurrentPhotoChange }: PickBestViewProps) {
  const { t } = useLanguage()
  const [remaining, setRemaining] = useState<Photo[]>(photos)
  const [currentIndex, setCurrentIndex] = useState(0)

  const restart = useCallback(() => {
    setRemaining([...photos])
    setCurrentIndex(0)
  }, [photos])

  const eliminate = useCallback(() => {
    if (remaining.length <= 1) return
    const next = remaining.filter((_, i) => i !== currentIndex)
    setRemaining(next)
    if (currentIndex >= next.length) {
      setCurrentIndex(0)
    }
  }, [remaining, currentIndex])

  const prev = () => setCurrentIndex((i) => (i - 1 + remaining.length) % remaining.length)
  const next = () => setCurrentIndex((i) => (i + 1) % remaining.length)

  const current = remaining[currentIndex]
  const isWinner = remaining.length === 1

  useEffect(() => {
    if (current) onCurrentPhotoChange?.(current)
  }, [current, onCurrentPhotoChange])

  if (!current) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={restart}>
          <RotateCcw className="mr-2 h-4 w-4" />
          {t('compare.restart')}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={eliminate}
          disabled={isWinner}
        >
          <X className="mr-2 h-4 w-4" />
          {t('compare.exclude')} {remaining.length}/{photos.length}
        </Button>
      </div>

      {isWinner && (
        <div className="flex items-center justify-center gap-2 py-3 rounded-lg bg-accent/15 border border-accent/30">
          <Trophy className="h-5 w-5 text-accent" />
          <span className="font-semibold">{t('compare.winner')}</span>
        </div>
      )}

      <PhotoCard
        photo={current}
        showNormalized={showNormalized}
        isBest={current.id === bestPhotoId}
        onPrev={remaining.length > 1 ? prev : undefined}
        onNext={remaining.length > 1 ? next : undefined}
      />

      <div className="flex justify-center gap-1">
        {remaining.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`w-2 h-2 rounded-full transition-colors ${
              i === currentIndex ? 'bg-primary' : 'bg-muted'
            }`}
            onClick={() => setCurrentIndex(i)}
            disabled={remaining.length <= 1}
            aria-label={`Photo ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
