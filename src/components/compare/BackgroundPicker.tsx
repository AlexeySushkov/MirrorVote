import { useState } from 'react'
import { Briefcase, Heart, PartyPopper, Sun, Layout, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/contexts/LanguageContext'

interface BackgroundPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (background: string) => void
  disabled?: boolean
}

const NEUTRAL = { key: 'compare.backgroundNeutral', icon: Layout } as const
const OTHER_PRESETS = [
  { key: 'compare.occasionOffice', icon: Briefcase },
  { key: 'compare.occasionDate', icon: Heart },
  { key: 'compare.occasionParty', icon: PartyPopper },
  { key: 'compare.occasionCasual', icon: Sun },
] as const

export function BackgroundPicker({ open, onOpenChange, onSelect, disabled }: BackgroundPickerProps) {
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
          <DialogTitle>{t('compare.chooseBackground')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Button
            variant="outline"
            className="w-full h-14 flex flex-col gap-1"
            disabled={disabled}
            onClick={() => handlePreset(NEUTRAL.key)}
          >
            <NEUTRAL.icon className="h-5 w-5" />
            <span className="text-sm">{t(NEUTRAL.key)}</span>
          </Button>
          <div className="grid grid-cols-2 gap-3">
            {OTHER_PRESETS.map(({ key, icon: Icon }) => (
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
              {t('compare.startSimpleLook')}
            </Button>
          </div>
          <Button
            variant="outline"
            className="w-full"
            disabled={disabled}
            onClick={() => onOpenChange(false)}
          >
            {t('compare.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
