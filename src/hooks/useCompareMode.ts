import { useState, useCallback } from 'react'

export type CompareViewMode = 'side-by-side' | 'carousel' | 'overlay'

export function useCompareMode() {
  const [viewMode, setViewMode] = useState<CompareViewMode>('side-by-side')
  const [showNormalized, setShowNormalized] = useState(true)
  const [overlayOpacity, setOverlayOpacity] = useState(0.5)
  const [sideBySideIndex, setSideBySideIndex] = useState(0)

  const toggleNormalized = useCallback(() => setShowNormalized((v) => !v), [])

  return {
    viewMode,
    setViewMode,
    showNormalized,
    toggleNormalized,
    overlayOpacity,
    setOverlayOpacity,
    sideBySideIndex,
    setSideBySideIndex,
  }
}
