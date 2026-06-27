import { NextRequest, NextResponse } from 'next/server'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { z } from 'zod'

const TIPOS_INTEGRACION = ['whatsapp', 'instagram', 'facebook', 'tokko', 'google_calendar', 'stripe', 'mercadopago', 'mercadolibre'] as const
const EsquemaConectar = z.object({
  tipo: z.enum(TIPOS_INTEGRACION),
  credenciales: z.record(z.string(), z.string()),
})

async function cifrarCredenciales(datos: Record<string, string>): Promise<string> {
  const clave = process.env.ENCRYPTION_KEY ?? 'inmocrm-default-key-32chars-abcdef'
  const claveHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(clave))
  const claveAES = await crypto.subtle.importKey('raw', claveHash, { name: 'AES-GCM' }, false, ['encrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const texto = new TextEncoder().encode(JSON.stringify(datos))
  const cifrado = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, claveAES, texto)
  const ivArr = Array.from(iv)
  const cifradoArr = Array.from(new Uint8Array(cifrado))
  return Buffer.from([...ivArr, ...cifradoArr]).toString('base64')
}

export async function GET(req: NextRequest) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('perfiles').select('tenant_id').eq('user_id', user.id).single()
  if (!perfil) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

  const { data } = await supabase
    .from('integraciones')
    .select('tipo, activa, creado_en')
    .eq('tenant_id', perfil.tenant_id)

  return NextResponse.json({ integraciones: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('perfiles').select('tenant_id').eq('user_id', user.id).single()
  if (!perfil) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

  const cuerpo = await req.json()
  const validacion = EsquemaConectar.safeParse(cuerpo)
  if (!validacion.success) {
    return NextResponse.json({ error: 'Datos inválidos', detalles: validacion.error.issues }, { status: 400 })
  }

  const { tipo, credenciales } = validacion.data

  // Cifrar credenciales antes de guardar
  const credencialesCifradas = await cifrarCredenciales(credenciales)

  const { error } = await supabase
    .from('integraciones')
    .upsert({
      tenant_id: perfil.tenant_id,
      tipo,
      credenciales: credencialesCifradas,
      activa: true,
    }, { onConflict: 'tenant_id,tipo' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('perfiles').select('tenant_id').eq('user_id', user.id).single()
  if (!perfil) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const tipo = searchParams.get('tipo')
  if (!tipo) return NextResponse.json({ error: 'Falta tipo' }, { status: 400 })

  const { error } = await supabase
    .from('integraciones')
    .update({ activa: false })
    .eq('tenant_id', perfil.tenant_id)
    .eq('tipo', tipo)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
