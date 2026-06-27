import { NextRequest, NextResponse } from 'next/server'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { z } from 'zod'

const EsquemaCheckout = z.object({
  tipo: z.enum(['suscripcion', 'tokens']),
  price_id: z.string().optional(),
  tokens: z.number().int().positive().optional(),
  monto_centavos: z.number().int().positive().optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('tenant_id, nombre, email')
    .eq('user_id', user.id)
    .single()

  if (!perfil) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, nombre, stripe_customer_id')
    .eq('id', perfil.tenant_id)
    .single()

  if (!tenant) return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 })

  const cuerpo = await req.json()
  const validacion = EsquemaCheckout.safeParse(cuerpo)
  if (!validacion.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  const { tipo, price_id, tokens, monto_centavos } = validacion.data
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) return NextResponse.json({ error: 'Stripe no configurado' }, { status: 500 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Construir sesión de Stripe via API REST (sin SDK para no aumentar bundle)
  let sessionBody: Record<string, unknown>

  if (tipo === 'suscripcion' && price_id) {
    sessionBody = {
      mode: 'subscription',
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: `${appUrl}/configuracion?tab=billing&exito=1`,
      cancel_url: `${appUrl}/configuracion?tab=billing`,
      customer_email: user.email,
      metadata: { tenant_id: perfil.tenant_id, tipo: 'suscripcion' },
      subscription_data: { metadata: { tenant_id: perfil.tenant_id } },
    }
  } else if (tipo === 'tokens' && tokens && monto_centavos) {
    sessionBody = {
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: monto_centavos,
          product_data: { name: `${tokens.toLocaleString()} tokens IA — InmoCRM.AI` },
        },
        quantity: 1,
      }],
      success_url: `${appUrl}/configuracion?tab=billing&tokens=ok`,
      cancel_url: `${appUrl}/configuracion?tab=billing`,
      customer_email: user.email,
      metadata: { tenant_id: perfil.tenant_id, tipo: 'tokens', tokens: String(tokens) },
    }
  } else {
    return NextResponse.json({ error: 'Parámetros incorrectos' }, { status: 400 })
  }

  const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(
      Object.entries(sessionBody).flatMap(([k, v]) =>
        typeof v === 'object'
          ? Object.entries(v as Record<string, unknown>).map(([sk, sv]) => [`${k}[${sk}]`, String(sv)])
          : [[k, String(v)]]
      )
    ),
  })

  const session = await resp.json() as { url?: string; error?: { message: string } }
  if (!resp.ok || !session.url) {
    return NextResponse.json({ error: session.error?.message ?? 'Error de Stripe' }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}
