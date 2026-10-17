import { describe, expect, it } from 'vitest'
import { translations } from './LanguageContext'

describe('translations', () => {
  it('ru and en define the same keys', () => {
    const ru = Object.keys(translations.ru)
    const en = Object.keys(translations.en)

    expect(ru.filter((key) => !en.includes(key)), 'missing in en').toEqual([])
    expect(en.filter((key) => !ru.includes(key)), 'missing in ru').toEqual([])
  })

  it('has no empty values', () => {
    for (const lang of ['ru', 'en'] as const) {
      const empty = Object.entries(translations[lang]).filter(([, value]) => !value.trim())
      expect(empty.map(([key]) => key), `empty in ${lang}`).toEqual([])
    }
  })
})
