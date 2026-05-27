import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import { Copy, ExternalLink } from 'lucide-react'

interface VoteLinkDialogProps {
  url: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VoteLinkDialog({ url, open, onOpenChange }: VoteLinkDialogProps) {
  const { t } = useLanguage()

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    toast.success(t('vote.linkCopied'))
    onOpenChange(false)
  }

  const handleOpenInNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('vote.dialogTitle')}</DialogTitle>
        </DialogHeader>
        <p className="break-all rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          {url}
        </p>
        <div className="flex flex-col gap-2">
          <Button className="w-full" onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            {t('vote.copyLink')}
          </Button>
          <Button variant="outline" className="w-full" onClick={handleOpenInNewTab}>
            <ExternalLink className="mr-2 h-4 w-4" />
            {t('vote.openInNewTab')}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            {t('vote.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
