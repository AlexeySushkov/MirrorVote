import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface NormalizeRequest {
  photoUrl: string
  allPhotoUrls: string[]
}

interface NormalizationResult {
  brightness: number
  contrast: number
  warmth: number
  cropTop: number
  cropBottom: number
  cropLeft: number
  cropRight: number
  scale: number
  description: string
}

const OPENROUTER_MODEL = Deno.env.get('OPENROUTER_MODEL') ?? 'google/gemini-2.5-flash'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { photoUrl, allPhotoUrls }: NormalizeRequest = await req.json()

    if (!photoUrl || !allPhotoUrls?.length) {
      return new Response(
        JSON.stringify({ error: 'photoUrl and allPhotoUrls required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')
    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenRouter API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      {
        type: 'text',
        text: `Проанализируй это фото из примерочной (индекс ${allPhotoUrls.indexOf(photoUrl) + 1} из ${allPhotoUrls.length}). 
Остальные фото серии: ${allPhotoUrls.length - 1} шт. 
Верни JSON с параметрами нормализации, чтобы все фото серии выглядели одинаково по свету и масштабу.

Верни ТОЛЬКО валидный JSON без markdown:
{
  "brightness": <число 0.5–1.5, 1.0 = без изменений>,
  "contrast": <число 0.5–1.5, 1.0 = без изменений>,
  "warmth": <число -20..+20, 0 = без изменений, CSS hue-rotate в градусах>,
  "cropTop": <% обрезки сверху, 0–15>,
  "cropBottom": <% обрезки снизу, 0–15>,
  "cropLeft": <% обрезки слева, 0–15>,
  "cropRight": <% обрезки справа, 0–15>,
  "scale": <масштаб 0.8–1.2, 1.0 = без изменений>,
  "description": "<краткое описание: поза, освещение, расстояние до зеркала>"
}`,
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
        model: OPENROUTER_MODEL,
        messages: [{ role: 'user', content }],
        max_tokens: 500,
      }),
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message ?? 'OpenRouter API error')
    }

    const text = data.choices?.[0]?.message?.content ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const normalization: NormalizationResult = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : {
          brightness: 1,
          contrast: 1,
          warmth: 0,
          cropTop: 0,
          cropBottom: 0,
          cropLeft: 0,
          cropRight: 0,
          scale: 1,
          description: '',
        }

    return new Response(
      JSON.stringify({ normalization }),
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
