import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SideBySide } from '@/components/compare/SideBySide'
import { CarouselView } from '@/components/compare/CarouselView'
import { OverlayView } from '@/components/compare/OverlayView'
import { CompareToolbar } from '@/components/compare/CompareToolbar'
import { AIRecommendation } from '@/components/analysis/AIRecommendation'
import { OutfitScore } from '@/components/analysis/OutfitScore'
import { CollageExport } from '@/components/share/CollageExport'
import { useSession, usePhotos, useUpdateSession } from '@/hooks/usePhotoSession'
import { supabase } from '@/integrations/supabase/client'
import { useOutfitAnalysis } from '@/hooks/useOutfitAnalysis'
import { useCompareMode } from '@/hooks/useCompareMode'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'

export function Compare() {
  const { id } = useParams<{ id: string }>()
  const { t } = useLanguage()
  const { viewMode, setViewMode, showNormalized, toggleNormalized, overlayOpacity, setOverlayOpacity, sideBySideIndex, setSideBySideIndex } = useCompareMode()

  const { data: session, isLoading: sessionLoading } = useSession(id)
  const { data: photos, isLoading: photosLoading } = usePhotos(id)
  const updateSession = useUpdateSession(id)
  const { analyzeOutfits } = useOutfitAnalysis()

  const [analyzing, setAnalyzing] = useState(false)

  const photosList = photos ?? []
  const isLoading = sessionLoading || photosLoading

  async function handleAnalyze() {
    if (photosList.length < 2) {
      toast.error('Нужно минимум 2 фото')
      return
    }
    setAnalyzing(true)
    try {
      const result = await analyzeOutfits(
        photosList.map((p) => p.photo_url),
        t('app.title').includes('Mirror') ? 'ru' : 'en'
      )
      await updateSession.mutateAsync({
        status: 'analyzed',
        best_photo_id: photosList[result.best_index]?.id ?? null,
        ai_recommendation: result.recommendation,
      } as never)
      for (let i = 0; i < photosList.length; i++) {
        const a = result.photos[i]
        if (a) {
          await supabase
            .from('mirror_photos')
            .update({
              analysis: {
                overall_score: a.overall_score,
                fit_score: a.fit_score,
                style_score: a.style_score,
                color_score: a.color_score,
                description: a.description,
                pros: a.pros ?? [],
                cons: a.cons ?? [],
                style_tips: a.style_tips ?? [],
              },
            } as never)
            .eq('id', photosList[i].id)
        }
      }
      toast.success('Анализ завершён')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка анализа')
    } finally {
      setAnalyzing(false)
    }
  }

  if (isLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="space-y-6">
        <CompareToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showNormalized={showNormalized}
          onToggleNormalized={toggleNormalized}
        />

        {photosList.length >= 2 && (
          <>
            {viewMode === 'side-by-side' && (
              <SideBySide
                photos={photosList}
                showNormalized={showNormalized}
                bestPhotoId={session.best_photo_id}
                leftIndex={sideBySideIndex}
                onLeftIndexChange={setSideBySideIndex}
              />
            )}
            {viewMode === 'carousel' && (
              <CarouselView
                photos={photosList}
                showNormalized={showNormalized}
                bestPhotoId={session.best_photo_id}
              />
            )}
            {viewMode === 'overlay' && (
              <OverlayView
                photos={photosList}
                showNormalized={showNormalized}
                bestPhotoId={session.best_photo_id}
                opacity={overlayOpacity}
                onOpacityChange={setOverlayOpacity}
                leftIndex={sideBySideIndex}
                rightIndex={(sideBySideIndex + 1) % photosList.length}
              />
            )}
          </>
        )}

        {photosList.length < 2 && (
          <p className="text-muted-foreground text-center py-8">
            Загрузите минимум 2 фото для сравнения
          </p>
        )}

        <div className="flex gap-2">
          <Button onClick={handleAnalyze} disabled={analyzing || photosList.length < 2}>
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('compare.analyzing')}
              </>
            ) : (
              t('compare.analyze')
            )}
          </Button>
          {photosList.length >= 2 && (
            <CollageExport photos={photosList} bestPhotoId={session.best_photo_id} />
          )}
        </div>

        {session.status === 'analyzed' && session.ai_recommendation && (
          <AIRecommendation recommendation={session.ai_recommendation} />
        )}

        {session.status === 'analyzed' && photosList.some((p) => p.analysis) && (
          <Card>
            <CardHeader>
              <h2 className="font-serif text-lg">{t('analysis.score')}</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {photosList.map((photo) => (
                  <div key={photo.id} className="text-center">
                    <OutfitScore
                      score={photo.analysis?.overall_score ?? 0}
                      label={photo.original_filename}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
