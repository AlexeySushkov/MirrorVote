import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { exportCollage } from '@/utils/collageGenerator'
import type { Photo } from '@/integrations/supabase/types'

interface CollageExportProps {
  photos: Photo[]
  bestPhotoId?: string | null
}

export function CollageExport({ photos, bestPhotoId }: CollageExportProps) {
  const { t } = useLanguage()

  const handleExport = async () => {
    await exportCollage(photos, bestPhotoId)
  }

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      {t('share.export')}
    </Button>
  )
}
