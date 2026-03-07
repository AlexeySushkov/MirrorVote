import { LayoutGrid, Images, Layers } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toggle } from '@/components/ui/toggle'
import { useLanguage } from '@/contexts/LanguageContext'
import type { CompareViewMode } from '@/hooks/useCompareMode'

interface CompareToolbarProps {
  viewMode: CompareViewMode
  onViewModeChange: (m: CompareViewMode) => void
  showNormalized: boolean
  onToggleNormalized: () => void
}

export function CompareToolbar({
  viewMode,
  onViewModeChange,
  showNormalized,
  onToggleNormalized,
}: CompareToolbarProps) {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <Tabs
        value={viewMode}
        onValueChange={(v) => onViewModeChange(v as CompareViewMode)}
      >
        <TabsList>
          <TabsTrigger value="side-by-side">
            <LayoutGrid className="mr-2 h-4 w-4" />
            {t('compare.sideBySide')}
          </TabsTrigger>
          <TabsTrigger value="carousel">
            <Images className="mr-2 h-4 w-4" />
            {t('compare.carousel')}
          </TabsTrigger>
          <TabsTrigger value="overlay">
            <Layers className="mr-2 h-4 w-4" />
            {t('compare.overlay')}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Toggle pressed={showNormalized} onPressedChange={onToggleNormalized}>
        {showNormalized ? t('compare.normalized') : t('compare.original')}
      </Toggle>
    </div>
  )
}
