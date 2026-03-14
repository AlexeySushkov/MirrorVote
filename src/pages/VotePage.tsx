import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { StarRating } from '@/components/vote/StarRating'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'

interface PublicPhoto {
  id: string
  photo_url: string
  processed_photo_url: string | null
  original_filename: string
  sort_order: number
  avg_rating: number
  vote_count: number
}

interface PublicSession {
  id: string
  title: string
}

interface PublicSessionData {
  session: PublicSession
  photos: PublicPhoto[]
}

function getFingerprint(token: string): string {
  const key = `mv_fp_${token}`
  try {
    let fp = localStorage.getItem(key)
    if (!fp) {
      fp = `fp_${Date.now()}_${Math.random().toString(36).slice(2)}`
      localStorage.setItem(key, fp)
    }
    return fp
  } catch {
    return `fp_${Date.now()}_${Math.random().toString(36).slice(2)}`
  }
}

export function VotePage() {
  const { token } = useParams<{ token: string }>()
  const { t } = useLanguage()
  const [data, setData] = useState<PublicSessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})
  const [myRatings, setMyRatings] = useState<Record<string, number>>({})
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (showLoading = true) => {
    if (!token) {
      setError(t('vote.invalidLink'))
      setLoading(false)
      return
    }
    if (showLoading && !data) setLoading(true)
    try {
      const { data: result, error: rpcError } = await supabase.rpc('get_public_session', {
        p_token: token,
      })
      if (rpcError) throw rpcError
      if (!result) {
        setError(t('vote.invalidLink'))
      } else {
        setData(result as PublicSessionData)
      }
    } catch (e) {
      console.error('VotePage fetch error:', e)
      setError(t('vote.invalidLink'))
    } finally {
      setLoading(false)
    }
  }, [token, t])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchData(false)
      toast.success(t('vote.refreshed'))
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRate = async (photoId: string, rating: number) => {
    if (!token) return
    setSubmitting((prev) => ({ ...prev, [photoId]: true }))
    try {
      const fingerprint = getFingerprint(token)
      const { error: rpcError } = await supabase.rpc('submit_rating', {
        p_token: token,
        p_photo_id: photoId,
        p_fingerprint: fingerprint,
        p_rating: rating,
      })
      if (rpcError) throw rpcError
      setMyRatings((prev) => ({ ...prev, [photoId]: rating }))
      toast.success(t('vote.thanks'))
      await fetchData(false)
    } catch (e) {
      console.error('submit_rating error:', e)
      toast.error(t('vote.error'))
    } finally {
      setSubmitting((prev) => ({ ...prev, [photoId]: false }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">{t('vote.loading')}</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">{t('vote.invalidLink')}</h1>
          <p className="text-muted-foreground">{t('vote.invalidLinkDesc')}</p>
        </div>
      </div>
    )
  }

  const { session, photos } = data
  if (!photos?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <p className="text-muted-foreground">{t('vote.noPhotos')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold mb-2">{session.title}</h1>
            <p className="text-sm text-muted-foreground">{t('vote.subtitle')}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t('vote.refresh')}
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="rounded-xl overflow-hidden bg-muted border shadow-sm"
            >
              <div className="aspect-[3/4] relative">
                <img
                  src={photo.processed_photo_url ?? photo.photo_url}
                  alt={photo.original_filename}
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div className="p-4 space-y-3">
                {(photo.vote_count > 0) && (
                  <div className="text-xl font-semibold text-foreground">
                    {photo.avg_rating} ★ · {photo.vote_count} {t('vote.votes')}
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium">{t('vote.rate')}</span>
                </div>
                <StarRating
                  value={myRatings[photo.id] ?? 0}
                  onChange={(r) => handleRate(photo.id, r)}
                  readonly={submitting[photo.id]}
                  size="lg"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
