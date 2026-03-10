import { useState } from 'react'
import { Briefcase, Heart, PartyPopper, Sun, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  onSelect: (occasion: string) => void
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

  function handlePreset(key: string) {
    onSelect(t(key))
    onOpenChange(false)
    setCustomValue('')
  }

  function handleCustom() {
    if (customValue.trim()) {
      onSelect(customValue.trim())
      onOpenChange(false)
      setCustomValue('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('compare.chooseOccasion')}</DialogTitle>
        </DialogHeader>

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
            onClick={handleCustom}
            disabled={disabled || !customValue.trim()}
          >
            {t('compare.startAnalysis')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
