import { supabase } from '@/integrations/supabase/client'
import type { NormalizationParams } from '@/integrations/supabase/types'

export function usePhotoNormalization() {
  async function normalizePhoto(photoId: string, photoUrl: string, allPhotoUrls: string[]): Promise<NormalizationParams> {
    const { data, error } = await supabase.functions.invoke('normalize-photo', {
      body: { photoUrl, allPhotoUrls },
    })

    if (error) throw error
    if (data?.error) throw new Error(data.error)

    const normalization = data?.normalization ?? {}
    await supabase.from('mirror_photos').update({ normalization, status: 'ready' } as never).eq('id', photoId)
    return normalization
  }

  return { normalizePhoto }
}
