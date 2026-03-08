import { supabase } from '@/integrations/supabase/client'
import type { PhotoAnalysis } from '@/integrations/supabase/types'
import { toFunctionError } from '@/utils/supabaseFunctionError'

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
    const { data: { session } } = await supabase.auth.getSession()
    let token = session?.access_token
    if (!token) {
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) {
        throw new Error('Сессия недействительна. Войдите заново.')
      }
      token = refreshed.session?.access_token
    }
    if (!token) {
      throw new Error('Сессия истекла или отсутствует. Войдите заново.')
    }
    supabase.functions.setAuth(token)

    const { data, error } = await supabase.functions.invoke('analyze-outfits', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: { photoUrls, language },
    })

    if (error) throw await toFunctionError(error)
    if (data?.error) throw new Error(data.error)

    return data?.analysis ?? { photos: [], best_index: 0, recommendation: '', comparison: '' }
  }

  return { analyzeOutfits }
}
