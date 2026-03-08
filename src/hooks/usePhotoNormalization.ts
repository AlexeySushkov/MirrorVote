import { supabase } from '@/integrations/supabase/client'
import type { NormalizationParams } from '@/integrations/supabase/types'
import { toFunctionError } from '@/utils/supabaseFunctionError'

export function usePhotoNormalization() {
  async function normalizePhoto(photoId: string, photoUrl: string, allPhotoUrls: string[]): Promise<NormalizationParams> {
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

    const { data, error } = await supabase.functions.invoke('normalize-photo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: { photoUrl, allPhotoUrls },
    })

    if (error) throw await toFunctionError(error)
    if (data?.error) throw new Error(data.error)

    const normalization = data?.normalization ?? {}
    await supabase.from('mirror_photos').update({ normalization, status: 'ready' } as never).eq('id', photoId)
    return normalization
  }

  return { normalizePhoto }
}
