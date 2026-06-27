import { NextRequest, NextResponse } from 'next/server'
import { crearClienteServidor } from '@/lib/supabase/servidor'

interface SegmentoCampana {
  etapas?: string[]
  etiquetas?: string[]
  canales?: string[]
}

interface Campana {
  id: string
  tenant_id: string
  nombre: string
  mensaje: string
  estado: string
  segmento?: SegmentoCampana
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Verificar propiedad de la campaña
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!perfil) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

  const { data: campana } = await supabase
    .from('campanas')
    .select('*')
    .eq('id', params.id)
    .eq('tenant_id', perfil.tenant_id)
    .single()

  if (!campana) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })
  if ((campana as Campana).estado === 'ENVIADA') {
    return NextResponse.json({ error: 'Esta campaña ya fue enviada' }, { status: 400 })
  }

  // Verificar saldo de tokens
  const { data: tenant } = await supabase
    .from('tenants')
    .select('saldo_tokens_ia')
    .eq('id', perfil.tenant_id)
    .single()

  if (!tenant || tenant.saldo_tokens_ia < 100) {
    return NextResponse.json({ error: 'Saldo de tokens insuficiente para lanzar la campaña' }, { status: 402 })
  }

  // Marcar como EN_PROCESO antes de delegar
  await supabase
    .from('campanas')
    .update({ estado: 'EN_PROCESO' })
    .eq('id', params.id)

  // Delegar el envío masivo a la Edge Function (async)
  const resultado = await supabase.functions.invoke('broadcast-whatsapp', {
    body: {
      campana_id: params.id,
      tenant_id: perfil.tenant_id,
      mensaje: (campana as Campana).mensaje,
      segmento: (campana as Campana).segmento ?? {},
    },
  })

  if (resultado.error) {
    await supabase.from('campanas').update({ estado: 'BORRADOR' }).eq('id', params.id)
    return NextResponse.json({ error: 'Error al lanzar la campaña' }, { status: 500 })
  }

  const { enviados = 0 } = (resultado.data as Record<string, number>) ?? {}

  return NextResponse.json({ ok: true, enviados })
}
