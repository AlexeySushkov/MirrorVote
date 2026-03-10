import { useCallback, useState } from 'react'
import { Camera, ImagePlus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { MAX_PHOTOS } from '@/utils/constants'
import { cn } from '@/lib/utils'

interface PhotoUploaderProps {
  onFilesSelected: (files: File[]) => void
  currentCount: number
  disabled?: boolean
}

export function PhotoUploader({ onFilesSelected, currentCount, disabled }: PhotoUploaderProps) {
  const { t } = useLanguage()
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return
      const arr = Array.from(files).slice(0, MAX_PHOTOS - currentCount)
      if (arr.length) onFilesSelected(arr)
    },
    [currentCount, onFilesSelected]
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => setIsDragging(false)

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={cn(
        'rounded-xl border-2 border-dashed p-8 text-center transition-colors',
        isDragging && 'border-primary bg-primary/5',
        disabled && 'opacity-50 pointer-events-none'
      )}
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/heic"
        multiple
        className="hidden"
        id="photo-upload"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        id="photo-capture"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <label htmlFor="photo-upload" className="cursor-pointer">
        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">{t('upload.dragDrop')}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('upload.minPhotos')} — {t('upload.maxPhotos')}
        </p>
      </label>
      <div className="mt-4 flex justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('photo-capture')?.click()}
        >
          <Camera className="mr-2 h-4 w-4" />
          {t('upload.camera')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('photo-upload')?.click()}
        >
          <ImagePlus className="mr-2 h-4 w-4" />
          {t('upload.gallery')}
        </Button>
      </div>
    </div>
  )
}
