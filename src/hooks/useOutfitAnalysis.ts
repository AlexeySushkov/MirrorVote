import { supabase } from '@/integrations/supabase/client'
import type { AnalysisQuota, PhotoAnalysis } from '@/integrations/supabase/types'
import { toFunctionError } from '@/utils/supabaseFunctionError'

export interface AnalysisResult {
  photos: Array<PhotoAnalysis & { index: number }>
  best_index: number
  recommendation: string
  comparison: string
  quota?: AnalysisQuota
}

export interface QuotaResult {
  used: number
  limit_count: number | null
  remaining: number | null
  plan_code: string
  period_yyyymm: number
}

export interface CreatePaymentResult {
  paymentId: string
  confirmationUrl: string
}

export function useOutfitAnalysis() {
  async function getAnalysisQuota(): Promise<QuotaResult> {
    const { data, error } = await supabase.rpc('get_analysis_quota')
    if (error) throw error
    const row = (Array.isArray(data) ? data[0] : data) as QuotaResult | undefined
    return row ?? { used: 0, limit_count: null, remaining: null, plan_code: 'free', period_yyyymm: 0 }
  }

  async function createUpgradePayment(packSize: 5 | 10 | 20 = 5): Promise<CreatePaymentResult> {
    const { data: { session } } = await supabase.auth.getSession()
    let token = session?.access_token
    if (!token) {
      const { data: refreshed } = await supabase.auth.refreshSession()
      token = refreshed.session?.access_token
    }
    if (!token) throw new Error('Сессия истекла. Войдите заново.')

    const { data, error } = await supabase.functions.invoke('create-yookassa-payment', {
      headers: { Authorization: `Bearer ${token}` },
      body: { packSize },
    })
    if (error) throw await toFunctionError(error)
    if (data?.error) throw new Error(String(data.error))
    if (!data?.confirmationUrl) throw new Error('Не удалось создать платёж')
    return data as CreatePaymentResult
  }

  async function analyzeOutfits(
    photoUrls: string[],
    language: string = 'ru',
    occasion?: string
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
      body: { photoUrls, language, occasion },
    })

    if (error) throw await toFunctionError(error)
    if (data?.error) throw new Error(data.error)

    const fallback: AnalysisResult = { photos: [], best_index: 0, recommendation: '', comparison: '' }
    return {
      ...(data?.analysis ?? fallback),
      quota: data?.quota,
    }
  }

  return { analyzeOutfits, getAnalysisQuota, createUpgradePayment }
}
