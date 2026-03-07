import type { NormalizationParams } from '@/integrations/supabase/types'

const DEFAULT_NORMALIZATION: Required<NormalizationParams> = {
  brightness: 1,
  contrast: 1,
  warmth: 0,
  cropTop: 0,
  cropBottom: 0,
  cropLeft: 0,
  cropRight: 0,
  scale: 1,
  description: '',
}

export function getNormalizationStyles(normalization: NormalizationParams | null): React.CSSProperties {
  if (!normalization) return {}

  const n = { ...DEFAULT_NORMALIZATION, ...normalization }
  return {
    filter: `brightness(${n.brightness}) contrast(${n.contrast}) hue-rotate(${n.warmth}deg)`,
    clipPath: `inset(${n.cropTop}% ${n.cropRight}% ${n.cropBottom}% ${n.cropLeft}%)`,
    transform: `scale(${n.scale})`,
  }
}
