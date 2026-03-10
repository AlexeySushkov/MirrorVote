import { supabase } from '@/integrations/supabase/client'
import { toFunctionError } from '@/utils/supabaseFunctionError'

export function usePhotoNormalization() {
  async function normalizePhoto(
    photoId: string,
    photoUrl: string,
    allPhotoUrls: string[],
    userId: string,
    sessionId: string
  ): Promise<{ processedPhotoUrl: string }> {
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
      body: { photoUrl, allPhotoUrls, photoId, userId, sessionId },
    })

    if (error) throw await toFunctionError(error)
    if (data?.error) throw new Error(data.error)

    const processedPhotoUrl = data?.processedPhotoUrl
    if (!processedPhotoUrl) throw new Error('No processed photo URL returned')

    await supabase
      .from('mirror_photos')
      .update({ processed_photo_url: processedPhotoUrl, status: 'ready' } as never)
      .eq('id', photoId)

    return { processedPhotoUrl }
  }

  return { normalizePhoto }
}
