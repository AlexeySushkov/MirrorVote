import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface YooKassaWebhookPayload {
  event?: string
  object?: {
    id?: string
    status?: string
    paid?: boolean
    metadata?: {
      user_id?: string
      plan_code?: string
    }
  }
}

function basicAuth(shopId: string, secretKey: string): string {
  const raw = `${shopId}:${secretKey}`
  return `Basic ${btoa(raw)}`
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const payload = (await req.json()) as YooKassaWebhookPayload
    const event = payload.event ?? ''
    const paymentId = payload.object?.id ?? ''

    if (!event || !paymentId) {
      return new Response('Bad payload', { status: 400 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const yookassaShopId = Deno.env.get('YOOKASSA_SHOP_ID') ?? ''
    const yookassaSecretKey = Deno.env.get('YOOKASSA_SECRET_KEY') ?? ''

    if (!supabaseUrl || !supabaseServiceKey || !yookassaShopId || !yookassaSecretKey) {
      throw new Error('Server secrets are not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    await supabase
      .from('billing_payment_events')
      .upsert({
        payment_id: paymentId,
        event_name: event,
        payload,
      } as never, { onConflict: 'payment_id,event_name' })

    // For webhook security, verify the latest payment state via API before changing subscription.
    const paymentResponse = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        Authorization: basicAuth(yookassaShopId, yookassaSecretKey),
      },
    })

    if (!paymentResponse.ok) {
      return new Response('OK', { status: 200 })
    }

    const payment = await paymentResponse.json()

    if (event !== 'payment.succeeded' || payment?.status !== 'succeeded' || payment?.paid !== true) {
      return new Response('OK', { status: 200 })
    }

    const metadata = payment?.metadata ?? payload.object?.metadata ?? {}
    const userId = metadata?.user_id as string | undefined
    const planCode = (metadata?.plan_code as string | undefined) ?? 'pro'

    if (!userId) {
      return new Response('OK', { status: 200 })
    }

    const nowIso = new Date().toISOString()
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    await supabase
      .from('billing_subscriptions')
      .upsert({
        user_id: userId,
        plan_code: planCode,
        status: 'active',
        provider: 'yookassa',
        provider_subscription_id: paymentId,
        current_period_start: nowIso,
        current_period_end: periodEnd,
      } as never, { onConflict: 'user_id' })

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('yookassa-webhook error:', error)
    // YooKassa retries non-200 statuses, so return 200 only when payload is accepted.
    return new Response('Error', { status: 500 })
  }
})
