import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SessionCard } from '@/components/session/SessionCard'
import { useAuth } from '@/contexts/AuthContext'
import { useSessions } from '@/hooks/usePhotoSession'
import { useLanguage } from '@/contexts/LanguageContext'

export function Sessions() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { data: sessions, isLoading } = useSessions(user?.id)

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-serif text-2xl font-semibold">{t('sessions.title')}</h1>
        <Button asChild>
          <Link to="/sessions/new">
            <Plus className="mr-2 h-4 w-4" />
            {t('sessions.new')}
          </Link>
        </Button>
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
            />
          ))}
        </div>
      )}
    </div>
  )
}
