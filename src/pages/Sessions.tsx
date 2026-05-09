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
  const [planLabel, setPlanLabel] = useState<'Free' | 'Pro'>('Free')
  const [remaining, setRemaining] = useState<number | null>(null)
  const [upgradePending, setUpgradePending] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    let mounted = true

    supabase
      .rpc('get_analysis_quota')
      .then(({ data, error }) => {
        if (!mounted || error) return
        const row = Array.isArray(data) ? data[0] : data
        const planCode = String(row?.plan_code ?? 'free').toLowerCase()
        setPlanLabel(planCode === 'pro' ? 'Pro' : 'Free')
        setRemaining(typeof row?.remaining === 'number' ? row.remaining : null)
      })
      .catch(() => {
        // Keep default Free if quota fetch fails.
      })

    return () => {
      mounted = false
    }
  }, [user?.id])

  const handleUpgradeClick = async () => {
    if (planLabel === 'Pro') return
    setUpgradePending(true)
    try {
      const { confirmationUrl } = await createUpgradePayment()
      window.location.href = confirmationUrl
    } catch (e) {
      showErrorToast(e, 'Ошибка перехода к оплате', 'Sessions.handleUpgradeClick')
    } finally {
      setUpgradePending(false)
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
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-2xl font-semibold">{t('sessions.title')}</h1>
          <Badge variant="secondary">
            {planLabel === 'Pro' ? 'Pro • Безлимит' : `Free • Осталось ${remaining ?? 0}`}
          </Badge>
          <Button
            variant={planLabel === 'Pro' ? 'secondary' : 'destructive'}
            size="sm"
            onClick={handleUpgradeClick}
            disabled={upgradePending || planLabel === 'Pro'}
          >
            {upgradePending ? 'Redirecting...' : 'Upgrade to Pro'}
          </Button>
        </div>
        <div className="flex gap-2">
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
