import { describe, expect, it } from 'vitest'
import { getNormalizationStyles } from './normalizationUtils'

describe('getNormalizationStyles', () => {
  it('returns no styles when normalization is null', () => {
    expect(getNormalizationStyles(null)).toEqual({})
  })

  it('applies defaults for missing params', () => {
    expect(getNormalizationStyles({})).toEqual({
      filter: 'brightness(1) contrast(1) hue-rotate(0deg)',
      clipPath: 'inset(0% 0% 0% 0%)',
      transform: 'scale(1)',
    })
  })

  it('maps params to CSS in top/right/bottom/left order', () => {
    const styles = getNormalizationStyles({
      brightness: 1.2,
      contrast: 0.9,
      warmth: 10,
      cropTop: 1,
      cropRight: 2,
      cropBottom: 3,
      cropLeft: 4,
      scale: 1.1,
    })
    expect(styles).toEqual({
      filter: 'brightness(1.2) contrast(0.9) hue-rotate(10deg)',
      clipPath: 'inset(1% 2% 3% 4%)',
      transform: 'scale(1.1)',
    })
  })
})
