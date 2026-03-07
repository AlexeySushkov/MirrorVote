import { supabase } from '@/integrations/supabase/client'
import type { PhotoAnalysis } from '@/integrations/supabase/types'

export interface AnalysisResult {
  photos: Array<PhotoAnalysis & { index: number }>
  best_index: number
  recommendation: string
  comparison: string
}

export function useOutfitAnalysis() {
  async function analyzeOutfits(
    photoUrls: string[],
    language: string = 'ru'
  ): Promise<AnalysisResult> {
    const { data, error } = await supabase.functions.invoke('analyze-outfits', {
      body: { photoUrls, language },
    })

    if (error) throw error
    if (data?.error) throw new Error(data.error)

    return data?.analysis ?? { photos: [], best_index: 0, recommendation: '', comparison: '' }
  }

  return { analyzeOutfits }
}
