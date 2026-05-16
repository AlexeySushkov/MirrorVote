import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface CreatePaymentRequest {
  packSize?: number
}

function basicAuth(shopId: string, secretKey: string): string {
  const raw = `${shopId}:${secretKey}`
  return `Basic ${btoa(raw)}`
}

function makeIdempotenceKey(): string {
  try {
    return globalThis.crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
}

const VALID_PACK_SIZES = [5, 10, 20] as const
type PackSize = typeof VALID_PACK_SIZES[number]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const yookassaShopId = Deno.env.get('YOOKASSA_SHOP_ID') ?? ''
    const yookassaSecretKey = Deno.env.get('YOOKASSA_SECRET_KEY') ?? ''
    const appUrl = Deno.env.get('APP_URL') ?? ''

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase service config missing')
    }
    if (!yookassaShopId || !yookassaSecretKey) {
      throw new Error('YooKassa credentials missing')
    }
    if (!appUrl) {
      throw new Error('APP_URL not configured')
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const jwt = authHeader.replace('Bearer ', '').trim()

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: userData, error: userError } = await supabase.auth.getUser(jwt)
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = (await req.json().catch(() => ({}))) as CreatePaymentRequest
    const packSize: PackSize = VALID_PACK_SIZES.includes(body.packSize as PackSize)
      ? (body.packSize as PackSize)
      : 5

    const priceMap: Record<PackSize, string> = {
      5:  Deno.env.get('YOOKASSA_PACK_5_AMOUNT')  ?? '50.00',
      10: Deno.env.get('YOOKASSA_PACK_10_AMOUNT') ?? '179.00',
      20: Deno.env.get('YOOKASSA_PACK_20_AMOUNT') ?? '299.00',
    }
    const amount = priceMap[packSize]

    const paymentBody = {
      amount: {
        value: amount,
        currency: 'RUB',
      },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: `${appUrl}/sessions`,
      },
      description: `MirrorVote ${packSize} оценок`,
      metadata: {
        user_id: userData.user.id,
        pack_size: String(packSize),
      },
    }

    const idempotenceKey = makeIdempotenceKey()
    const ykResponse = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: basicAuth(yookassaShopId, yookassaSecretKey),
        'Idempotence-Key': idempotenceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentBody),
    })

    const ykData = await ykResponse.json()
    if (!ykResponse.ok) {
      const message = ykData?.description ?? ykData?.message ?? 'YooKassa create payment failed'
      throw new Error(message)
    }

    const confirmationUrl = ykData?.confirmation?.confirmation_url
    if (!confirmationUrl) {
      throw new Error('YooKassa confirmation_url missing')
    }

    return new Response(
      JSON.stringify({
        paymentId: ykData.id,
        confirmationUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('create-yookassa-payment error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
