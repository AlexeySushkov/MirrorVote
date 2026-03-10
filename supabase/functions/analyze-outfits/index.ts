import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface AnalyzeRequest {
  photoUrls: string[]
  language: string
  occasion?: string
}

const OPENROUTER_MODEL = Deno.env.get('OPENROUTER_MODEL') ?? 'google/gemini-2.5-flash'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { photoUrls, language = 'ru', occasion }: AnalyzeRequest = await req.json()

    if (!photoUrls?.length) {
      return new Response(
        JSON.stringify({ error: 'photoUrls required' }),
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

    const occasionContext = occasion
      ? `\n\nОценивай наряды С ТОЧКИ ЗРЕНИЯ конкретного случая: "${occasion}". Все оценки, плюсы, минусы, советы и рекомендации должны учитывать именно этот контекст. Для каждого фото дай текстовую рекомендацию, подходит ли этот наряд для "${occasion}" и почему.`
      : ''

    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      {
        type: 'text',
        text: `Ты — профессиональный стилист и fashion-консультант. Тебе показаны ${photoUrls.length} фотографий человека в разных нарядах из примерочной.${occasionContext}

Для КАЖДОГО фото (пронумеруй по порядку 0, 1, 2...) верни оценку и текстовую рекомендацию. Затем дай общую рекомендацию.

Верни СТРОГО только валидный JSON без markdown:
{
  "photos": [
    {
      "index": 0,
      "overall_score": <1-10>,
      "fit_score": <1-10, насколько хорошо сидит>,
      "style_score": <1-10, стиль и актуальность>,
      "color_score": <1-10, цветовое сочетание>,
      "description": "<что за наряд, 1-2 предложения>",
      "verdict": "<текстовая рекомендация для этого фото: подходит ли наряд${occasion ? ' для ' + occasion : ''}, почему, что можно улучшить, 2-4 предложения>",
      "pros": ["<плюс 1>", "<плюс 2>"],
      "cons": ["<минус 1>", "<минус 2>"],
      "style_tips": ["<совет 1>", "<совет 2>"]
    }
  ],
  "best_index": <индекс лучшего фото, 0-based>,
  "recommendation": "<общая рекомендация, 2-4 предложения, какой наряд лучше и почему${occasion ? ' для ' + occasion : ''}>",
  "comparison": "<краткое сравнение нарядов между собой>"
}

Отвечай на языке: ${language}`,
      },
      ...photoUrls.map((url) => ({
        type: 'image_url' as const,
        image_url: { url },
      })),
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
        max_tokens: 3000,
      }),
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message ?? 'OpenRouter API error')
    }

    const text = data.choices?.[0]?.message?.content ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { photos: [], best_index: 0, recommendation: '', comparison: '' }

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('analyze-outfits error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
