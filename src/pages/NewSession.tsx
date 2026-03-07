import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
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

export function NewSession() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [normalizing, setNormalizing] = useState(false)
  const [normalizeProgress, setNormalizeProgress] = useState(0)

  const createSession = useCreateSession(user?.id)
  const uploadPhoto = useUploadPhoto(user?.id, sessionId || undefined)
  const updateSession = useUpdateSession(sessionId || undefined)
  const deletePhoto = useDeletePhoto(sessionId)
  const { normalizePhoto } = usePhotoNormalization()

  const { data: photos } = usePhotos(sessionId ?? undefined)
  const photosList = photos ?? []

  useEffect(() => {
    if (user && !sessionId && !createSession.isPending) {
      createSession.mutateAsync(undefined)
        .then((s) => setSessionId(s.id))
        .catch((err) => {
          console.error('Session creation failed:', err)
          toast.error('Не удалось создать сессию')
        })
    }
  }, [user])

  async function handleFiles(files: File[]) {
    if (!sessionId) {
      toast.error('Сессия не создана, обновите страницу')
      return
    }
    for (const f of files) {
      try {
        await uploadPhoto.mutateAsync(f)
      } catch (err) {
        console.error('Upload failed for', f.name, err)
      }
    }
  }

  async function handleNormalize() {
    if (!sessionId || photosList.length < MIN_PHOTOS) {
      toast.error(`Нужно минимум ${MIN_PHOTOS} фото`)
      return
    }
    setNormalizing(true)
    try {
      const urls = photosList.map((p) => p.photo_url)
      await updateSession.mutateAsync({ status: 'normalizing' as const } as never)
      for (let i = 0; i < photosList.length; i++) {
        await supabase.from('mirror_photos').update({ status: 'normalizing' }).eq('id', photosList[i].id)
        await normalizePhoto(photosList[i].id, photosList[i].photo_url, urls)
        setNormalizeProgress(((i + 1) / photosList.length) * 100)
      }
      await updateSession.mutateAsync({ status: 'ready' })
      toast.success('Фото выровнены')
      navigate(`/sessions/${sessionId}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка нормализации')
    } finally {
      setNormalizing(false)
      setNormalizeProgress(0)
    }
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Создание сессии...</div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
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
                <div className="flex gap-2">
                  <Button onClick={handleNormalize} disabled={normalizing}>
                    {normalizing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('upload.progress')}
                      </>
                    ) : (
                      t('upload.normalize')
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/sessions/${sessionId}`)}
                  >
                    {t('upload.continue')}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
