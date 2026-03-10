import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface NormalizeRequest {
  photoUrl: string
  allPhotoUrls: string[]
  photoId: string
  userId: string
  sessionId: string
}

const PROMPT_VERSION = 'v4-clear-look-openrouter'
const CLEAR_LOOK_PROMPT = `Professional product photo. Keep face and expression unchanged. Clean plain background. Studio lighting, even and neutral. Person fills the frame. Remove phone if visible. Pose: one arm down, one hand on hip, feet shoulder-width apart. Preserve identity, clothing, colors and fabric texture. No extra accessories.`

const OPENROUTER_IMAGE_MODEL = Deno.env.get('OPENROUTER_IMAGE_MODEL') ?? Deno.env.get('OPENROUTER_MODEL') ?? 'google/gemini-2.5-flash-image'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { photoUrl, allPhotoUrls, photoId, userId, sessionId }: NormalizeRequest = await req.json()

    if (!photoUrl || !allPhotoUrls?.length || !photoId || !userId || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'photoUrl, allPhotoUrls, photoId, userId, sessionId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')
    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OPENROUTER_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase config missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      {
        type: 'text',
        text: `Edit this fitting room photo. ${CLEAR_LOOK_PROMPT}`,
      },
      {
        type: 'image_url',
        image_url: { url: photoUrl },
      },
    ]

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENROUTER_IMAGE_MODEL,
        messages: [{ role: 'user', content }],
        modalities: ['image', 'text'],
        max_tokens: 4096,
      }),
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message ?? 'OpenRouter API error')
    }

    const message = data.choices?.[0]?.message
    const images = message?.images ?? message?.image_url
    if (!images?.length) {
      throw new Error('OpenRouter returned no image')
    }

    const firstImage = images[0]
    const imageUrl = firstImage?.image_url?.url ?? firstImage?.url
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('OpenRouter returned invalid image format')
    }

    let imgBytes: ArrayBuffer
    if (imageUrl.startsWith('data:')) {
      const base64 = imageUrl.split(',')[1]
      if (!base64) throw new Error('Invalid base64 image')
      const binary = atob(base64)
      const arr = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
      imgBytes = arr.buffer
    } else {
      const imgRes = await fetch(imageUrl)
      if (!imgRes.ok) throw new Error('Failed to download generated image')
      imgBytes = await imgRes.arrayBuffer()
    }

    const ext = 'jpg'
    const storagePath = `${userId}/${sessionId}/${photoId}_processed.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('mirror_photos')
      .upload(storagePath, imgBytes, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`)

    const { data: urlData } = supabase.storage.from('mirror_photos').getPublicUrl(storagePath)
    const processedPhotoUrl = urlData.publicUrl

    return new Response(
      JSON.stringify({
        processedPhotoUrl,
        promptVersion: PROMPT_VERSION,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('normalize-photo error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
