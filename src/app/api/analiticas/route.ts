import { NextRequest, NextResponse } from 'next/server'
import { crearClienteServidor } from '@/lib/supabase/servidor'

export async function GET(req: NextRequest) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('perfiles').select('tenant_id').eq('user_id', user.id).single()
  if (!perfil) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

  const tenantId = perfil.tenant_id
  const { searchParams } = new URL(req.url)
  const dias = parseInt(searchParams.get('dias') ?? '30')
  const desde = new Date(Date.now() - dias * 86400000).toISOString()

  // Ejecutar todas las queries en paralelo
  const [
    resContactos,
    resConversaciones,
    resMensajes,
    resTokens,
    resEmbudo,
    resCanales,
    resVisitas,
  ] = await Promise.all([
    // Contactos por día
    supabase.rpc('analitica_contactos_por_dia', { p_tenant_id: tenantId, p_desde: desde }),
    // Conversaciones activas por día
    supabase.rpc('analitica_conversaciones_por_dia', { p_tenant_id: tenantId, p_desde: desde }),
    // Mensajes por rol (BOT vs AGENTE vs USUARIO)
    supabase.from('mensajes')
      .select('rol')
      .eq('conversaciones.tenant_id', tenantId)
      .gte('timestamp', desde),
    // Uso de tokens por día
    supabase.from('uso_tokens')
      .select('cantidad, timestamp')
      .eq('tenant_id', tenantId)
      .gte('timestamp', desde)
      .order('timestamp'),
    // Distribución del embudo
    supabase.from('contactos')
      .select('etapa')
      .eq('tenant_id', tenantId),
    // Contactos por canal
    supabase.from('contactos')
      .select('canal_origen')
      .eq('tenant_id', tenantId)
      .gte('creado_en', desde),
    // Visitas por estado
    supabase.from('visitas')
      .select('estado')
      .eq('tenant_id', tenantId)
      .gte('programada_en', desde),
  ])

  // KPIs totales simples
  const [kpiContactos, kpiConversaciones, kpiCampanas] = await Promise.all([
    supabase.from('contactos').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('conversaciones').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).neq('estado', 'CERRADO'),
    supabase.from('campanas').select('total_enviados, total_respondidos').eq('tenant_id', tenantId).eq('estado', 'ENVIADA'),
  ])

  // Procesar tokens por día
  const tokensPorDia: Record<string, number> = {}
  for (const t of (resTokens.data ?? [])) {
    const dia = t.timestamp.slice(0, 10)
    tokensPorDia[dia] = (tokensPorDia[dia] ?? 0) + t.cantidad
  }

  // Procesar embudo
  const embudoConteo: Record<string, number> = {}
  for (const c of (resEmbudo.data ?? [])) {
    embudoConteo[c.etapa] = (embudoConteo[c.etapa] ?? 0) + 1
  }

  // Procesar canales
  const canalesConteo: Record<string, number> = {}
  for (const c of (resCanales.data ?? [])) {
    canalesConteo[c.canal_origen] = (canalesConteo[c.canal_origen] ?? 0) + 1
  }

  // Procesar campañas
  const totalEnviados = (kpiCampanas.data ?? []).reduce((s, c) => s + (c.total_enviados ?? 0), 0)
  const totalRespondidos = (kpiCampanas.data ?? []).reduce((s, c) => s + (c.total_respondidos ?? 0), 0)

  // Visitas por estado
  const visitasConteo: Record<string, number> = {}
  for (const v of (resVisitas.data ?? [])) {
    visitasConteo[v.estado] = (visitasConteo[v.estado] ?? 0) + 1
  }

  return NextResponse.json({
    kpis: {
      total_contactos: kpiContactos.count ?? 0,
      conversaciones_activas: kpiConversaciones.count ?? 0,
      campanas_enviadas: (kpiCampanas.data ?? []).length,
      tasa_respuesta_campanas: totalEnviados > 0 ? Math.round((totalRespondidos / totalEnviados) * 100) : 0,
    },
    contactos_por_dia: resContactos.data ?? [],
    conversaciones_por_dia: resConversaciones.data ?? [],
    tokens_por_dia: Object.entries(tokensPorDia).map(([dia, cantidad]) => ({ dia, cantidad })).sort((a, b) => a.dia.localeCompare(b.dia)),
    embudo: Object.entries(embudoConteo).map(([etapa, total]) => ({ etapa, total })),
    canales: Object.entries(canalesConteo).map(([canal, total]) => ({ canal, total })),
    visitas: Object.entries(visitasConteo).map(([estado, total]) => ({ estado, total })),
  })
}
