import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PhotoUploader } from '@/components/session/PhotoUploader'
import { PhotoGrid } from '@/components/session/PhotoGrid'
import { useAuth } from '@/contexts/AuthContext'
import {
  useCreateSession,
  useUploadPhoto,
  useUpdateSession,
  useDeletePhoto,
  usePhotos,
  MIN_PHOTOS,
  MAX_PHOTOS,
} from '@/hooks/usePhotoSession'
import { supabase } from '@/integrations/supabase/client'
import { usePhotoNormalization } from '@/hooks/usePhotoNormalization'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import { showErrorToast } from '@/utils/errorToast'

export function NewSession() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [normalizing, setNormalizing] = useState(false)
  const [normalizeProgress, setNormalizeProgress] = useState(0)
  const creatingRef = useRef(false)

  const createSession = useCreateSession(user?.id)
  const uploadPhoto = useUploadPhoto(user?.id, sessionId || undefined)
  const updateSession = useUpdateSession(sessionId || undefined)
  const deletePhoto = useDeletePhoto(sessionId)
  const { normalizePhoto } = usePhotoNormalization()

  const { data: photos } = usePhotos(sessionId ?? undefined)
  const photosList = photos ?? []

  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (sessionId) return sessionId
    if (creatingRef.current) return null
    creatingRef.current = true
    try {
      const s = await createSession.mutateAsync(undefined)
      setSessionId(s.id)
      return s.id
    } catch (err) {
      showErrorToast(err, 'Не удалось создать сессию', 'NewSession.ensureSession')
      return null
    } finally {
      creatingRef.current = false
    }
  }, [sessionId, createSession])

  async function handleFiles(files: File[]) {
    const sid = await ensureSession()
    if (!sid) return
    for (const f of files) {
      try {
        await uploadPhoto.mutateAsync({ file: f, overrideSessionId: sid })
      } catch (err) {
        console.error('Upload failed for', f.name, err)
      }
    }
  }

  async function handleNormalize() {
    if (!user || !sessionId || photosList.length < MIN_PHOTOS) {
      showErrorToast(`Нужно минимум ${MIN_PHOTOS} фото`, `Нужно минимум ${MIN_PHOTOS} фото`, 'NewSession.handleNormalize.validation')
      return
    }
    setNormalizing(true)
    try {
      const urls = photosList.map((p) => p.photo_url)
      await updateSession.mutateAsync({ status: 'normalizing' as const } as never)
      for (let i = 0; i < photosList.length; i++) {
        await supabase.from('mirror_photos').update({ status: 'normalizing' }).eq('id', photosList[i].id)
        await normalizePhoto(photosList[i].id, photosList[i].photo_url, urls, user.id, sessionId)
        setNormalizeProgress(((i + 1) / photosList.length) * 100)
      }
      await updateSession.mutateAsync({ status: 'ready' })
      toast.success(t('upload.clearLookDone'))
      navigate(`/sessions/${sessionId}`)
    } catch (e) {
      showErrorToast(e, 'Ошибка нормализации', 'NewSession.handleNormalize')
    } finally {
      setNormalizing(false)
      setNormalizeProgress(0)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <div className="mb-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/sessions')}>
          <List className="mr-2 h-4 w-4" />
          {t('nav.sessions')}
        </Button>
      </div>
      <Card>
        <CardHeader>
          <h1 className="font-serif text-2xl">{t('upload.title')}</h1>
        </CardHeader>
        <CardContent className="space-y-6">
          <PhotoUploader
            onFilesSelected={(files) => handleFiles(files)}
            currentCount={photosList.length}
            disabled={photosList.length >= MAX_PHOTOS || uploadPhoto.isPending}
          />
          {photosList.length > 0 && (
            <>
              <PhotoGrid
                photos={photosList}
                onRemove={(id) => deletePhoto.mutate(id)}
                showRemove={!normalizing}
              />
              {normalizing && (
                <div className="space-y-2">
                  <Progress value={normalizeProgress} />
                  <p className="text-sm text-muted-foreground">{t('upload.progress')}</p>
                </div>
              )}
              {!normalizing && photosList.length >= MIN_PHOTOS && (
                <Button onClick={() => navigate(`/sessions/${sessionId}`)}>
                  {t('upload.continue')}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
