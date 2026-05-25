import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface NormalizeRequest {
  photoUrl: string
  allPhotoUrls: string[]
  photoId: string
  userId: string
  sessionId: string
  background?: string
  storagePath?: string
}

const PROMPT_VERSION = 'v6-remove-replace-bg'

function buildBackgroundPrompt(background: string): string {
  const lower = background.toLowerCase()
  if (lower.includes('neutral') || lower.includes('нейтральн')) {
    return 'Remove the original background entirely. Replace it with a clean plain neutral background (white, light gray, or soft gradient). The new background must be clearly different from the original.'
  }
  if (lower.includes('office') || lower.includes('офис')) {
    return 'Remove the original background entirely. Replace it with a professional office background: subtle blurred office interior, neutral tones.'
  }
  if (lower.includes('date') || lower.includes('свидан')) {
    return 'Remove the original background entirely. Replace it with a romantic date setting: soft warm background, restaurant or cozy interior vibe, slightly blurred.'
  }
  if (lower.includes('party') || lower.includes('вечеринк')) {
    return 'Remove the original background entirely. Replace it with a festive party background: dynamic atmosphere, blurred venue lights or colorful setting.'
  }
  if (lower.includes('casual') || lower.includes('повседневн')) {
    return 'Remove the original background entirely. Replace it with a casual relaxed background: natural everyday setting, soft and unobtrusive.'
  }
  return `Remove the original background entirely. Replace it with: ${background}.`
}

const BASE_PROMPT = `Professional fitting room photo edit. Your primary task: replace the background as instructed below. Keep the original person exactly the same — do not alter faces, skin, clothing, colors, or fabric texture. Preserve identity, facial structure, skin texture, and expression. Studio lighting, even and flattering. Person fills the frame. Remove phone if visible. Pose: one arm down, one hand on hip, feet shoulder-width apart. No extra accessories.`

// Must use an image-capable model (e.g. gemini-2.5-flash-image). Do NOT fall back to OPENROUTER_MODEL
// (gemini-2.5-flash) — it does not support image output and causes "No endpoints found" for modalities.
const OPENROUTER_IMAGE_MODEL = Deno.env.get('OPENROUTER_IMAGE_MODEL') ?? 'google/gemini-2.5-flash-image'

// Flux and similar models only output image; Gemini outputs both image and text
const isImageOnlyModel = /flux|sourceful/i.test(OPENROUTER_IMAGE_MODEL)
const OUTPUT_MODALITIES = isImageOnlyModel ? ['image'] : ['image', 'text']

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { photoUrl, allPhotoUrls, photoId, userId, sessionId, background, storagePath }: NormalizeRequest = await req.json()

    if ((!photoUrl && !storagePath) || !allPhotoUrls?.length || !photoId || !userId || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'photoUrl or storagePath, allPhotoUrls, photoId, userId, sessionId required' }),
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

    const inputImageUrl = storagePath
      ? `${supabaseUrl}/storage/v1/object/public/mirror_photos/${storagePath}`
      : photoUrl!

    const bgPrompt = background ? buildBackgroundPrompt(background) : 'Clean plain neutral background (white, light gray, or soft gradient).'
    const fullPrompt = `Edit this fitting room photo. ${BASE_PROMPT} ${bgPrompt}`

    console.log('[normalize-photo] model:', OPENROUTER_IMAGE_MODEL)
    console.log('[normalize-photo] imageUrl:', inputImageUrl)
    console.log('[normalize-photo] prompt:', fullPrompt)

    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      {
        type: 'text',
        text: fullPrompt,
      },
      {
        type: 'image_url',
        image_url: { url: inputImageUrl },
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
        modalities: OUTPUT_MODALITIES,
        max_tokens: 4096,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('OpenRouter HTTP', response.status, JSON.stringify(data))
    }
    if (data.error) {
      const msg = data.error.message ?? data.error.code ?? 'OpenRouter API error'
      console.error('OpenRouter error:', JSON.stringify(data.error))
      throw new Error(`OpenRouter: ${msg}`)
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
    const timestamp = Date.now()
    const processedStoragePath = `${userId}/${sessionId}/${photoId}_processed_${timestamp}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('mirror_photos')
      .upload(processedStoragePath, imgBytes, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`)

    const { data: urlData } = supabase.storage.from('mirror_photos').getPublicUrl(processedStoragePath)
    const processedPhotoUrl = urlData.publicUrl

    return new Response(
      JSON.stringify({
        processedPhotoUrl,
        processedStoragePath,
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
