import { Images, Trophy } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toggle } from '@/components/ui/toggle'
import { useLanguage } from '@/contexts/LanguageContext'
import type { CompareViewMode } from '@/hooks/useCompareMode'

interface CompareToolbarProps {
  viewMode: CompareViewMode
  onViewModeChange: (m: CompareViewMode) => void
  canComparePair: boolean
}

export function CompareToolbar({
  viewMode,
  onViewModeChange,
  canComparePair,
}: CompareToolbarProps) {
  const { t } = useLanguage()

  return (
    <Tabs
      value={viewMode}
      onValueChange={(v) => onViewModeChange(v as CompareViewMode)}
    >
      <TabsList>
        <TabsTrigger value="pick-best" disabled={!canComparePair}>
          <Trophy className="mr-2 h-4 w-4" />
          {t('compare.pickBest')}
        </TabsTrigger>
        <TabsTrigger value="carousel">
          <Images className="mr-2 h-4 w-4" />
          {t('compare.carousel')}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
