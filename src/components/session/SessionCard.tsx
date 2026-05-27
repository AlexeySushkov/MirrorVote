import { useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronRight, Link2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import type { Session } from '@/integrations/supabase/types'
import { usePhotos, useUpdateSession, MAX_PHOTOS } from '@/hooks/usePhotoSession'
import { useLanguage } from '@/contexts/LanguageContext'
import { useQueryClient } from '@tanstack/react-query'
import { makeClientId } from '@/utils/id'
import { VoteLinkDialog } from '@/components/share/VoteLinkDialog'

interface SessionCardProps {
  session: Session
  onClick: () => void
  selectable?: boolean
  selected?: boolean
  onSelectChange?: (checked: boolean) => void
}

export function SessionCard({ session, onClick, selectable, selected, onSelectChange }: SessionCardProps) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const { data: photos } = usePhotos(session.id)
  const updateSession = useUpdateSession(session.id)
  const [voteLinkUrl, setVoteLinkUrl] = useState<string | null>(null)

  const handleCopyVoteLink = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      let token = session.share_token
      if (!token) {
        token = makeClientId().replace(/-/g, '').slice(0, 12)
        await updateSession.mutateAsync({ share_token: token } as never)
        queryClient.setQueryData(['session', session.id], (old: typeof session | undefined) =>
          old ? { ...old, share_token: token } : old
        )
        queryClient.invalidateQueries({ queryKey: ['sessions'] })
      }
      const url = `${window.location.origin}/app/v/${token}`
      setVoteLinkUrl(url)
    } catch (err) {
      console.error('Copy vote link error:', err)
    }
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col gap-3">
        {/* Верхняя строка: чекбокс + полоса превью + шеврон */}
        <div className="flex gap-3 items-center">
          {selectable && (
            <Checkbox
              checked={selected}
              onCheckedChange={(v) => onSelectChange?.(v === true)}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0"
            />
          )}
          <div className="flex gap-2 overflow-x-auto flex-1 min-w-0 pb-0.5">
            {photos?.slice(0, MAX_PHOTOS).map((p) => (
              <div
                key={p.id}
                className="w-16 h-20 shrink-0 rounded-lg overflow-hidden bg-muted"
              >
                <img src={p.processed_photo_url ?? p.photo_url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>
        {/* Строка 2: название + дата + бейдж */}
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <p className="font-medium truncate">
              {session.background
                ? `${session.title} (${session.background})`
                : session.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(session.created_at), 'd MMM yyyy, HH:mm', { locale: ru })}
            </p>
          </div>
          <Badge variant={session.status === 'analyzed' ? 'accent' : 'secondary'} className="shrink-0">
            {t(`session.status.${session.status}`)}
          </Badge>
        </div>
        {/* Строка 3: кнопка голосования */}
        <div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={handleCopyVoteLink}
          >
            <Link2 className="h-4 w-4 mr-1" />
            {t('vote.copyLink')}
          </Button>
        </div>
      </CardContent>
      <VoteLinkDialog
        url={voteLinkUrl ?? ''}
        open={!!voteLinkUrl}
        onOpenChange={(open) => { if (!open) setVoteLinkUrl(null) }}
      />
    </Card>
  )
}
