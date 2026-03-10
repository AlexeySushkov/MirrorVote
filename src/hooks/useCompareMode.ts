import { useState, useCallback } from 'react'

export type CompareViewMode = 'pick-best' | 'carousel'

export function useCompareMode() {
  const [viewMode, setViewMode] = useState<CompareViewMode>('pick-best')
  const [showNormalized, setShowNormalized] = useState(true)
  const [sideBySideIndex, setSideBySideIndex] = useState(0)

  const toggleNormalized = useCallback(() => setShowNormalized((v) => !v), [])

  return {
    viewMode,
    setViewMode,
    showNormalized,
    toggleNormalized,
    sideBySideIndex,
    setSideBySideIndex,
  }
}
