import { NextRequest, NextResponse } from 'next/server'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { z } from 'zod'

const EsquemaVisita = z.object({
  contacto_id: z.string().uuid(),
  propiedad_id: z.string().uuid().optional(),
  programada_en: z.string().datetime(),
  notas: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!perfil) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const desde = searchParams.get('desde') ?? new Date().toISOString()
  const hasta = searchParams.get('hasta') ?? new Date(Date.now() + 7 * 86400000).toISOString()

  const { data: visitas, error } = await supabase
    .from('visitas')
    .select('*, contactos(nombre, telefono), propiedades(titulo, direccion, zona)')
    .eq('tenant_id', perfil.tenant_id)
    .gte('programada_en', desde)
    .lte('programada_en', hasta)
    .order('programada_en', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ visitas })
}

export async function POST(req: NextRequest) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!perfil) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

  const cuerpo = await req.json()
  const validacion = EsquemaVisita.safeParse(cuerpo)
  if (!validacion.success) {
    return NextResponse.json({ error: 'Datos inválidos', detalles: validacion.error.issues }, { status: 400 })
  }

  const { data: visita, error } = await supabase
    .from('visitas')
    .insert({
      ...validacion.data,
      tenant_id: perfil.tenant_id,
      estado: 'PROGRAMADA',
    })
    .select('*, contactos(nombre), propiedades(titulo)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Crear recordatorio automático 24h antes
  await supabase.from('recordatorios').insert({
    tenant_id: perfil.tenant_id,
    contacto_id: validacion.data.contacto_id,
    programado_en: new Date(new Date(validacion.data.programada_en).getTime() - 24 * 3600 * 1000).toISOString(),
    mensaje: 'Hola {nombre}! Te recuerdo que manana tenes una visita programada. Te esperamos!',
    disparado_por: 'IA',
    estado: 'PENDIENTE',
  })

  // Actualizar etapa del contacto
  await supabase
    .from('contactos')
    .update({ etapa: 'visita_agendada' })
    .eq('id', validacion.data.contacto_id)

  return NextResponse.json({ ok: true, visita }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id, estado } = await req.json()
  if (!id || !estado) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })

  const { error } = await supabase
    .from('visitas')
    .update({ estado })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
