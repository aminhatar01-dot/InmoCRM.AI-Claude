import { NextRequest, NextResponse } from 'next/server'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { z } from 'zod'

const EsquemaCampana = z.object({
  nombre: z.string().min(2),
  mensaje: z.string().min(5),
  segmento: z.object({
    etapas: z.array(z.string()).optional(),
    etiquetas: z.array(z.string()).optional(),
    canales: z.array(z.string()).optional(),
  }).optional(),
  programada_en: z.string().datetime().optional(),
})

async function obtenerTenantId(supabase: Awaited<ReturnType<typeof crearClienteServidor>>, userId: string) {
  const { data } = await supabase
    .from('perfiles')
    .select('tenant_id')
    .eq('user_id', userId)
    .single()
  return data?.tenant_id ?? null
}

export async function GET(req: NextRequest) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const tenantId = await obtenerTenantId(supabase, user.id)
  if (!tenantId) return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 })

  const { data, error } = await supabase
    .from('campanas')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('creado_en', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campanas: data })
}

export async function POST(req: NextRequest) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const tenantId = await obtenerTenantId(supabase, user.id)
  if (!tenantId) return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 })

  const cuerpo = await req.json()
  const validacion = EsquemaCampana.safeParse(cuerpo)
  if (!validacion.success) {
    return NextResponse.json({ error: 'Datos inválidos', detalles: validacion.error.issues }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('campanas')
    .insert({
      ...validacion.data,
      tenant_id: tenantId,
      estado: 'BORRADOR',
      total_enviados: 0,
      total_respondidos: 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campana: data }, { status: 201 })
}
