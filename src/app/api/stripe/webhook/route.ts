import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente con service role para operaciones de billing (no expuesto al navegador)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verificarFirmaStripe(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const parts = signature.split(',')
  const timestamp = parts.find(p => p.startsWith('t='))?.slice(2)
  const firmaRecibida = parts.find(p => p.startsWith('v1='))?.slice(3)

  if (!timestamp || !firmaRecibida) return false

  const payload = `${timestamp}.${body}`
  const clave = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const firma = await crypto.subtle.sign('HMAC', clave, encoder.encode(payload))
  const firmaHex = Array.from(new Uint8Array(firma)).map(b => b.toString(16).padStart(2, '0')).join('')
  return firmaHex === firmaRecibida
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

  const firmaValida = await verificarFirmaStripe(body, signature, webhookSecret)
  if (!firmaValida) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
  }

  let evento: { type: string; data: { object: Record<string, unknown> } }
  try {
    evento = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const obj = evento.data.object

  switch (evento.type) {
    case 'checkout.session.completed': {
      const sessionMeta = obj.metadata as Record<string, string>
      const tenantId = sessionMeta?.tenant_id
      const tipo = sessionMeta?.tipo

      if (!tenantId) break

      if (tipo === 'tokens') {
        const tokensStr = sessionMeta?.tokens
        const tokens = tokensStr ? parseInt(tokensStr) : 0
        if (tokens > 0) {
          await supabaseAdmin.rpc('agregar_tokens', { p_tenant_id: tenantId, p_cantidad: tokens })
          await supabaseAdmin.from('pagos').insert({
            tenant_id: tenantId,
            stripe_payment_id: obj.payment_intent as string,
            monto: obj.amount_total as number,
            moneda: obj.currency as string,
            concepto: 'tokens',
            tokens_agregados: tokens,
          })
          // Notificación interna
          await supabaseAdmin.from('notificaciones').insert({
            tenant_id: tenantId,
            tipo: 'tokens_recargados',
            titulo: 'Tokens recargados',
            cuerpo: `Se agregaron ${tokens.toLocaleString()} tokens a tu cuenta.`,
            datos: { tokens: String(tokens) },
          })
        }
      }
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const stripeCustomerId = obj.customer as string
      const estado = obj.status as string
      const priceId = ((obj.items as Record<string, unknown>)?.data as Array<Record<string, unknown>>)?.[0]?.price as Record<string, unknown>

      // Buscar tenant por stripe_customer_id
      const { data: tenant } = await supabaseAdmin
        .from('tenants')
        .select('id')
        .eq('stripe_customer_id', stripeCustomerId)
        .single()

      if (tenant) {
        const plan = priceId?.nickname as string ?? 'pro'
        await supabaseAdmin.from('tenants').update({
          stripe_subscription_id: obj.id as string,
          stripe_price_id: priceId?.id as string,
          suscripcion_activa: estado === 'active',
          plan: plan.toLowerCase() as 'basico' | 'pro' | 'enterprise',
          fecha_vencimiento: new Date((obj.current_period_end as number) * 1000).toISOString(),
        }).eq('id', tenant.id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const stripeCustomerId = obj.customer as string
      const { data: tenant } = await supabaseAdmin
        .from('tenants')
        .select('id')
        .eq('stripe_customer_id', stripeCustomerId)
        .single()

      if (tenant) {
        await supabaseAdmin.from('tenants').update({
          suscripcion_activa: false,
          plan: 'basico',
        }).eq('id', tenant.id)
      }
      break
    }

    case 'invoice.payment_failed': {
      const stripeCustomerId = obj.customer as string
      const { data: tenant } = await supabaseAdmin
        .from('tenants')
        .select('id')
        .eq('stripe_customer_id', stripeCustomerId)
        .single()

      if (tenant) {
        await supabaseAdmin.from('notificaciones').insert({
          tenant_id: tenant.id,
          tipo: 'pago_fallido',
          titulo: 'Pago fallido',
          cuerpo: 'Tu pago de suscripcion no pudo procesarse. Por favor actualiza tu metodo de pago.',
          datos: { invoice_id: obj.id as string },
        })
      }
      break
    }
  }

  return NextResponse.json({ recibido: true })
}
