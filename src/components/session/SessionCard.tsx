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
import { toast } from 'sonner'

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

  const handleCopyVoteLink = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      let token = session.share_token
      if (!token) {
        token = crypto.randomUUID().replace(/-/g, '').slice(0, 12)
        await updateSession.mutateAsync({ share_token: token } as never)
        queryClient.setQueryData(['session', session.id], (old: typeof session | undefined) =>
          old ? { ...old, share_token: token } : old
        )
        queryClient.invalidateQueries({ queryKey: ['sessions'] })
      }
      const url = `${window.location.origin}/v/${token}`
      await navigator.clipboard.writeText(url)
      toast.success(t('vote.linkCopied'))
    } catch (err) {
      console.error('Copy vote link error:', err)
      toast.error(t('vote.error'))
    }
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4 flex gap-4 items-center">
        {selectable && (
          <Checkbox
            checked={selected}
            onCheckedChange={(v) => onSelectChange?.(v === true)}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0"
          />
        )}
        <div className="flex gap-2 overflow-x-auto flex-1 min-w-0">
          {photos?.slice(0, MAX_PHOTOS).map((p) => (
            <div
              key={p.id}
              className="w-16 h-20 shrink-0 rounded-lg overflow-hidden bg-muted"
            >
              <img src={p.processed_photo_url ?? p.photo_url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-between min-w-0">
          <div>
            <p className="font-medium truncate">{session.title}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(session.created_at), 'd MMM yyyy, HH:mm', { locale: ru })}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={session.status === 'analyzed' ? 'accent' : 'secondary'}>
              {t(`session.status.${session.status}`)}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 shrink-0"
              onClick={handleCopyVoteLink}
            >
              <Link2 className="h-4 w-4 mr-1" />
              {t('vote.copyLink')}
            </Button>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
      </CardContent>
    </Card>
  )
}
