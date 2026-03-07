import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Session } from '@/integrations/supabase/types'
import { usePhotos } from '@/hooks/usePhotoSession'

interface SessionCardProps {
  session: Session
  onClick: () => void
}

export function SessionCard({ session, onClick }: SessionCardProps) {
  const { data: photos } = usePhotos(session.id)

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4 flex gap-4">
        <div className="flex gap-2 overflow-x-auto flex-1 min-w-0">
          {photos?.slice(0, 3).map((p) => (
            <div
              key={p.id}
              className="w-16 h-20 shrink-0 rounded-lg overflow-hidden bg-muted"
            >
              <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-between min-w-0">
          <div>
            <p className="font-medium truncate">{session.title}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(session.created_at), 'd MMM yyyy', { locale: ru })}
            </p>
          </div>
          <Badge variant={session.status === 'analyzed' ? 'accent' : 'secondary'}>
            {session.status}
          </Badge>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
      </CardContent>
    </Card>
  )
}
