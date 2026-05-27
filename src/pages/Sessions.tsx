import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SessionCard } from '@/components/session/SessionCard'
import { useAuth } from '@/contexts/AuthContext'
import { useSessions, useDeleteSessions } from '@/hooks/usePhotoSession'
import { useOutfitAnalysis } from '@/hooks/useOutfitAnalysis'
import { useLanguage } from '@/contexts/LanguageContext'
import { showErrorToast } from '@/utils/errorToast'
import { supabase } from '@/integrations/supabase/client'

export function Sessions() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { data: sessions, isLoading } = useSessions(user?.id)
  const deleteSessions = useDeleteSessions(user?.id)
  const { createUpgradePayment } = useOutfitAnalysis()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [planCode, setPlanCode] = useState<string>('free')
  const [remaining, setRemaining] = useState<number | null>(null)
  const [packPending, setPackPending] = useState<number | null>(null)

  useEffect(() => {
    if (!user?.id) return
    let mounted = true

    supabase.rpc('get_analysis_quota').then(
      ({ data, error }) => {
        if (!mounted || error) return
        const row = Array.isArray(data) ? data[0] : data
        setPlanCode(String(row?.plan_code ?? 'free').toLowerCase())
        setRemaining(typeof row?.remaining === 'number' ? row.remaining : null)
      },
      () => {},
    )

    return () => {
      mounted = false
    }
  }, [user?.id])

  const handleBuyPack = async (packSize: 5 | 10 | 20) => {
    setPackPending(packSize)
    try {
      const { confirmationUrl } = await createUpgradePayment(packSize)
      window.location.href = confirmationUrl
    } catch (e) {
      showErrorToast(e, 'Ошибка перехода к оплате', 'Sessions.handleBuyPack')
    } finally {
      setPackPending(null)
    }
  }

  const toggleSelect = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleDeleteSelected = async () => {
    if (!selected.size) return
    try {
      await deleteSessions.mutateAsync(Array.from(selected))
      setSelected(new Set())
    } catch (e) {
      showErrorToast(e, 'Failed to delete sessions', 'Sessions.handleDeleteSelected')
    }
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
        {/* Ряд 1: заголовок + бейдж */}
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-serif text-2xl font-semibold">{t('sessions.title')}</h1>
          <Badge variant="secondary">
            {planCode === 'credits'
              ? `Осталось ${remaining ?? 0} AI оценок`
              : `Free • Осталось ${remaining ?? 0} AI оценок`}
          </Badge>
        </div>
        {/* Ряд 2: удалить (если выбрано) | купить | новая сессия */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          {selected.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={deleteSessions.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('sessions.deleteSelected')} ({selected.size})
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleBuyPack(5)}
            disabled={packPending !== null}
          >
            {packPending !== null ? '...' : 'Купить 5 AI оценок'}
          </Button>
          <Button asChild variant="outline">
            <Link to="/sessions/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('sessions.new')}
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Загрузка...</div>
      ) : !sessions?.length ? (
        <div className="text-center py-16">
          <p className="text-lg font-medium">{t('sessions.empty')}</p>
          <p className="text-muted-foreground mt-2">{t('sessions.emptyDesc')}</p>
          <Button asChild className="mt-6">
            <Link to="/sessions/new">{t('sessions.new')}</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onClick={() => navigate(`/sessions/${session.id}`)}
              selectable
              selected={selected.has(session.id)}
              onSelectChange={(checked) => toggleSelect(session.id, checked)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
