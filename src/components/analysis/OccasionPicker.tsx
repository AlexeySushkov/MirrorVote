import { useState } from 'react'
import { Briefcase, Heart, PartyPopper, Sun, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/contexts/LanguageContext'

interface OccasionPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (occasion: string, withNormalize: boolean) => void
  disabled?: boolean
}

const PRESETS = [
  { key: 'compare.occasionOffice', icon: Briefcase },
  { key: 'compare.occasionDate', icon: Heart },
  { key: 'compare.occasionParty', icon: PartyPopper },
  { key: 'compare.occasionCasual', icon: Sun },
] as const

export function OccasionPicker({ open, onOpenChange, onSelect, disabled }: OccasionPickerProps) {
  const { t } = useLanguage()
  const [customValue, setCustomValue] = useState('')
  const [withNormalize, setWithNormalize] = useState(true)

  function resetState() {
    setWithNormalize(true)
    setCustomValue('')
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) resetState()
    onOpenChange(isOpen)
  }

  function handlePreset(key: string) {
    onSelect(t(key), withNormalize)
    onOpenChange(false)
    resetState()
  }

  function handleCustom() {
    if (customValue.trim()) {
      onSelect(customValue.trim(), withNormalize)
      onOpenChange(false)
      resetState()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('compare.chooseOccasion')}</DialogTitle>
        </DialogHeader>

        {/* Checkbox: normalize before rating */}
        <div className="flex items-center gap-3 py-2 px-1 rounded-lg bg-muted/50 border mb-1">
          <Checkbox
            id="normalize-check"
            checked={withNormalize}
            onCheckedChange={(v) => setWithNormalize(Boolean(v))}
            disabled={disabled}
          />
          <Label htmlFor="normalize-check" className="text-sm cursor-pointer leading-tight">
            {t('compare.unifyLook')}
          </Label>
        </div>

        <Button
          variant="outline"
          className="w-full h-14 flex flex-col gap-1 mb-3"
          disabled={disabled}
          onClick={() => {
            onSelect('', withNormalize)
            onOpenChange(false)
            resetState()
          }}
        >
          <span className="text-sm font-medium">{t('compare.occasionNeutral')}</span>
        </Button>

        <div className="grid grid-cols-2 gap-3 py-2">
          {PRESETS.map(({ key, icon: Icon }) => (
            <Button
              key={key}
              variant="outline"
              className="h-16 flex flex-col gap-1"
              disabled={disabled}
              onClick={() => handlePreset(key)}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm">{t(key)}</span>
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Pencil className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('compare.occasionCustom')}
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustom()}
              className="pl-9"
              disabled={disabled}
            />
          </div>
          <Button
            variant="outline"
            onClick={handleCustom}
            disabled={disabled || !customValue.trim()}
          >
            {t('compare.startAnalysis')}
          </Button>
        </div>
        <Button
          variant="destructive"
          className="w-full"
          disabled={disabled}
          onClick={() => handleOpenChange(false)}
        >
          {t('compare.cancel')}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
