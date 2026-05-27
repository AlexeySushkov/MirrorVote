import { useState, useCallback } from 'react'

export type CompareViewMode = 'carousel'

export function useCompareMode() {
  const [showNormalized, setShowNormalized] = useState(true)
  const [sideBySideIndex, setSideBySideIndex] = useState(0)

  const toggleNormalized = useCallback(() => setShowNormalized((v) => !v), [])

  return {
    showNormalized,
    toggleNormalized,
    sideBySideIndex,
    setSideBySideIndex,
  }
}
