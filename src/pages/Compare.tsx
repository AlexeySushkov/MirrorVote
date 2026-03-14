import { useEffect, useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, PlusCircle, List, ImagePlus, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CarouselView } from '@/components/compare/CarouselView'
import { PickBestView } from '@/components/compare/PickBestView'
import { CompareToolbar } from '@/components/compare/CompareToolbar'
import { InlineVerdict } from '@/components/analysis/InlineVerdict'
import { OccasionPicker } from '@/components/analysis/OccasionPicker'
import { BackgroundPicker } from '@/components/compare/BackgroundPicker'
import { CollageExport } from '@/components/share/CollageExport'
import { Progress } from '@/components/ui/progress'
import { useSession, usePhotos, useUpdateSession, useUploadPhoto, MAX_PHOTOS } from '@/hooks/usePhotoSession'
import { supabase } from '@/integrations/supabase/client'
import { useOutfitAnalysis } from '@/hooks/useOutfitAnalysis'
import { usePhotoNormalization } from '@/hooks/usePhotoNormalization'
import { useCompareMode } from '@/hooks/useCompareMode'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import { showErrorToast } from '@/utils/errorToast'
import type { Photo } from '@/integrations/supabase/types'

export function Compare() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { viewMode, setViewMode, showNormalized, toggleNormalized, sideBySideIndex, setSideBySideIndex } = useCompareMode()

  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: session, isLoading: sessionLoading } = useSession(id)
  const { data: photos, isLoading: photosLoading } = usePhotos(id)
  const updateSession = useUpdateSession(id)
  const { analyzeOutfits } = useOutfitAnalysis()
  const { normalizePhoto } = usePhotoNormalization()
  const uploadPhoto = useUploadPhoto(user?.id, id)

  const [analyzing, setAnalyzing] = useState(false)
  const [occasionOpen, setOccasionOpen] = useState(false)
  const [backgroundOpen, setBackgroundOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [normalizing, setNormalizing] = useState(false)
  const [normalizeProgress, setNormalizeProgress] = useState(0)

  const photosList = photos ?? []
  const isLoading = sessionLoading || photosLoading
  const hasAtLeastOnePhoto = photosList.length >= 1
  const hasPhotoPair = photosList.length >= 2

  const currentPhoto: Photo | undefined =
    viewMode === 'pick-best' ? undefined : photosList[currentPhotoIndex]
  const [pickBestPhoto, setPickBestPhoto] = useState<Photo | undefined>()
  const activePhoto =
    viewMode === 'pick-best'
      ? pickBestPhoto
        ? photosList.find((p) => p.id === pickBestPhoto.id) ?? pickBestPhoto
        : undefined
      : currentPhoto

  useEffect(() => {
    if (!photosLoading && !hasPhotoPair && viewMode === 'pick-best') {
      setViewMode('carousel')
    }
  }, [photosLoading, hasPhotoPair, viewMode, setViewMode])

  useEffect(() => {
    if (viewMode === 'carousel') {
      setCurrentPhotoIndex(sideBySideIndex)
    }
  }, [sideBySideIndex, viewMode])

  const handleCarouselSlide = useCallback((idx: number) => {
    setCurrentPhotoIndex(idx)
  }, [])

  const handlePickBestPhoto = useCallback((photo: Photo) => {
    setPickBestPhoto(photo)
  }, [])

  const addPhotoRef = useRef<HTMLInputElement>(null)
  const canAddMore = photosList.length < MAX_PHOTOS
  const allHaveProcessed = photosList.length > 0 && photosList.every((p) => p.processed_photo_url)

  async function handleAddPhotos(files: FileList | null) {
    if (!files?.length || !id) return
    const remaining = MAX_PHOTOS - photosList.length
    const toUpload = Array.from(files).slice(0, remaining)
    for (const f of toUpload) {
      try {
        await uploadPhoto.mutateAsync(f)
      } catch (err) {
        console.error('Upload failed for', f.name, err)
      }
    }
    await queryClient.refetchQueries({ queryKey: ['photos', id] })
  }

  async function handleClearLook(background: string) {
    if (!user || !id || photosList.length === 0) return
    setNormalizing(true)
    setNormalizeProgress(0)
    let failedPhotoId: string | null = null
    try {
      await updateSession.mutateAsync({ status: 'normalizing' as const } as never)
      const urls = photosList.map((p) => p.photo_url)
      const needProcessing = photosList
      for (let i = 0; i < needProcessing.length; i++) {
        const p = needProcessing[i]
        failedPhotoId = p.id
        const { processedPhotoUrl } = await normalizePhoto(p.id, p.photo_url, urls, user.id, id, background, p.storage_path)
        failedPhotoId = null
        setNormalizeProgress(((i + 1) / needProcessing.length) * 100)
        const urlWithBust = processedPhotoUrl + (processedPhotoUrl.includes('?') ? '&' : '?') + `t=${Date.now()}`
        queryClient.setQueryData(['photos', id], (old: typeof photosList | undefined) => {
          if (!old) return old
          return old.map((ph) =>
            ph.id === p.id ? { ...ph, processed_photo_url: urlWithBust } : ph
          )
        })
      }
      await updateSession.mutateAsync({ status: 'ready' })
      if (!showNormalized) toggleNormalized()
      toast.success(t('upload.clearLookDone'))
    } catch (e) {
      if (failedPhotoId) {
        await supabase.from('mirror_photos').update({ status: 'error' }).eq('id', failedPhotoId)
      }
      await updateSession.mutateAsync({ status: 'ready' })
      showErrorToast(e, 'Simple Look (AI) error', 'Compare.handleClearLook')
    } finally {
      setNormalizing(false)
      setNormalizeProgress(0)
    }
  }

  async function handleAnalyze(occasion: string) {
    if (!hasAtLeastOnePhoto) {
      showErrorToast('Нужно минимум 1 фото', 'Нужно минимум 1 фото', 'Compare.handleAnalyze.validation')
      return
    }
    setAnalyzing(true)
    try {
      const lang = t('app.title').includes('Mirror') ? 'ru' : 'en'
      const result = await analyzeOutfits(
        photosList.map((p) => p.processed_photo_url ?? p.photo_url),
        lang,
        occasion
      )
      await updateSession.mutateAsync({
        status: 'analyzed',
        best_photo_id: photosList[result.best_index]?.id ?? null,
        ai_recommendation: result.recommendation,
      } as never)
      const analysisUpdates = photosList.map((p, i) => {
        const a = result.photos[i]
        if (!a) return null
        const analysis = {
          overall_score: a.overall_score,
          fit_score: a.fit_score,
          style_score: a.style_score,
          color_score: a.color_score,
          description: a.description,
          verdict: a.verdict ?? '',
          pros: a.pros ?? [],
          cons: a.cons ?? [],
          style_tips: a.style_tips ?? [],
        }
        return { id: p.id, analysis }
      })

      for (const u of analysisUpdates) {
        if (!u) continue
        await supabase
          .from('mirror_photos')
          .update({ analysis: u.analysis } as never)
          .eq('id', u.id)
      }

      queryClient.setQueryData(['photos', id], (old: typeof photosList | undefined) => {
        if (!old) return old
        return old.map((p, i) => {
          const u = analysisUpdates[i]
          if (!u) return p
          return { ...p, analysis: u.analysis }
        })
      })
      queryClient.setQueryData(['session', id], (old: typeof session | undefined) => {
        if (!old) return old
        return {
          ...old,
          status: 'analyzed' as const,
          best_photo_id: photosList[result.best_index]?.id ?? null,
          ai_recommendation: result.recommendation,
        }
      })
      await queryClient.refetchQueries({ queryKey: ['photos', id] })
      await queryClient.refetchQueries({ queryKey: ['session', id] })
      toast.success('Анализ завершён')
    } catch (e) {
      showErrorToast(e, 'Ошибка анализа', 'Compare.handleAnalyze')
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
      <input
        ref={addPhotoRef}
        type="file"
        accept="image/jpeg,image/png,image/heic"
        multiple
        className="hidden"
        onChange={(e) => {
          handleAddPhotos(e.target.files)
          e.target.value = ''
        }}
      />
      <div className="space-y-6">
        <CompareToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          canComparePair={hasPhotoPair}
        />

        {hasAtLeastOnePhoto && (
          <>
            {viewMode === 'carousel' && hasAtLeastOnePhoto && (
              <CarouselView
                photos={photosList}
                showNormalized={showNormalized}
                bestPhotoId={session.best_photo_id}
                onSlideChange={handleCarouselSlide}
              />
            )}
            {viewMode === 'pick-best' && hasPhotoPair && (
              <PickBestView
                photos={photosList}
                showNormalized={showNormalized}
                bestPhotoId={session.best_photo_id}
                onCurrentPhotoChange={handlePickBestPhoto}
              />
            )}
          </>
        )}

        {hasAtLeastOnePhoto && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/sessions')}>
              <List className="mr-2 h-4 w-4" />
              {t('nav.sessions')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/sessions/new')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('sessions.new')}
            </Button>
            {canAddMore && (
              <Button
                variant="outline"
                onClick={() => addPhotoRef.current?.click()}
                disabled={uploadPhoto.isPending}
              >
                {uploadPhoto.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="mr-2 h-4 w-4" />
                )}
                {t('upload.addMore')}
              </Button>
            )}
            <Button variant="destructive" onClick={() => setOccasionOpen(true)} disabled={analyzing || !hasAtLeastOnePhoto}>
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('compare.analyzing')}
                </>
              ) : (
                t('compare.analyze')
              )}
            </Button>
            <OccasionPicker
              open={occasionOpen}
              onOpenChange={setOccasionOpen}
              onSelect={handleAnalyze}
              disabled={analyzing}
            />
            <Button
              variant="destructive"
              onClick={() => setBackgroundOpen(true)}
              disabled={normalizing}
            >
              {normalizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Simple Look (AI)...
                </>
              ) : (
                t('compare.normalized')
              )}
            </Button>
            <BackgroundPicker
              open={backgroundOpen}
              onOpenChange={setBackgroundOpen}
              onSelect={(bg) => {
                setBackgroundOpen(false)
                handleClearLook(bg)
              }}
              disabled={normalizing}
            />
            {hasPhotoPair && (
              <CollageExport photos={photosList} bestPhotoId={session.best_photo_id} />
            )}
            {photosList.some((p) => p.processed_photo_url) && (
              <Button
                variant={showNormalized ? 'outline' : 'secondary'}
                onClick={toggleNormalized}
              >
                <Eye className="mr-2 h-4 w-4" />
                {showNormalized ? t('compare.original') : t('compare.backToLook')}
              </Button>
            )}
          </div>
        )}

        {session.status === 'analyzed' && activePhoto?.analysis && (
          <InlineVerdict analysis={activePhoto.analysis} />
        )}

        {!hasAtLeastOnePhoto && (
          <p className="text-muted-foreground text-center py-8">
            Загрузите минимум 1 фото для анализа
          </p>
        )}

        {normalizing && (
          <div className="space-y-1">
            <Progress value={normalizeProgress} />
            <p className="text-xs text-muted-foreground text-center">
              Simple Look — {Math.round(normalizeProgress)}%
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
