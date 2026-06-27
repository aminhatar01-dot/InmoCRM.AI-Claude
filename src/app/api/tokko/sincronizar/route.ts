import { NextRequest, NextResponse } from 'next/server'
import { crearClienteServidor } from '@/lib/supabase/servidor'

interface PropiedadTokko {
  id: number
  title: string
  type: { name: string }
  operations: Array<{ operation_type: string; prices: Array<{ price: number; currency: string }> }>
  location: { name: string; full_location: string }
  suite_amount: number
  bathroom_amount: number
  total_surface: number
  description: string
  photos: Array<{ image: string }>
  web_price: boolean
  status: number
}

function mapearOperacion(tokkoOp: string): string {
  const mapa: Record<string, string> = {
    'Venta': 'venta',
    'Alquiler': 'alquiler',
    'Alquiler Temporario': 'alquiler_temporario',
  }
  return mapa[tokkoOp] ?? 'venta'
}

function mapearTipo(tokkoTipo: string): string {
  const mapa: Record<string, string> = {
    'Departamento': 'departamento',
    'Casa': 'casa',
    'PH': 'ph',
    'Local Comercial': 'local',
    'Oficina': 'oficina',
    'Terreno': 'terreno',
    'Cochera': 'cochera',
    'Galpon': 'galpon',
  }
  return mapa[tokkoTipo] ?? 'departamento'
}

export async function POST(req: NextRequest) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Obtener credenciales Tokko del tenant
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!perfil) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

  const { data: integracion } = await supabase
    .from('integraciones')
    .select('credenciales')
    .eq('tenant_id', perfil.tenant_id)
    .eq('tipo', 'tokko')
    .eq('activa', true)
    .single()

  if (!integracion?.credenciales) {
    return NextResponse.json({ error: 'Tokko Broker no configurado' }, { status: 400 })
  }

  const credenciales = integracion.credenciales as Record<string, string>
  const apiKey = credenciales.api_key

  // Llamar a la API de Tokko Broker
  let sincronizadas = 0
  let pagina = 0
  const limite = 100

  while (true) {
    const url = `https://www.tokkobroker.com/api/v1/property/?key=${apiKey}&limit=${limite}&offset=${pagina * limite}&format=json`
    const resp = await fetch(url)
    if (!resp.ok) break

    const json = await resp.json() as { objects: PropiedadTokko[]; meta: { total_count: number } }
    const propiedades = json.objects ?? []
    if (propiedades.length === 0) break

    // Transformar y upsert en Supabase
    const registros = propiedades.map((p: PropiedadTokko) => {
      const operacion = p.operations?.[0]
      const precio = operacion?.prices?.[0]
      return {
        tenant_id: perfil.tenant_id,
        titulo: p.title,
        tipo: mapearTipo(p.type?.name ?? ''),
        operacion: mapearOperacion(operacion?.operation_type ?? 'Venta'),
        precio: precio?.price ?? null,
        moneda: precio?.currency ?? 'USD',
        zona: p.location?.name ?? '',
        direccion: p.location?.full_location ?? '',
        dormitorios: p.suite_amount ?? null,
        banios: p.bathroom_amount ?? null,
        superficie_total: p.total_surface ?? null,
        descripcion: p.description ?? '',
        fotos: (p.photos ?? []).slice(0, 10).map((ph: { image: string }) => ph.image),
        estado: p.status === 2 ? 'disponible' : 'vendida',
        fuente_externa: 'tokko',
        id_externo: String(p.id),
        url_externa: `https://www.tokkobroker.com/propiedad/${p.id}`,
      }
    })

    await supabase
      .from('propiedades')
      .upsert(registros, { onConflict: 'tenant_id,id_externo', ignoreDuplicates: false })

    sincronizadas += propiedades.length
    pagina++

    // Si no hay más páginas
    if (sincronizadas >= json.meta.total_count) break
  }

  // Disparar vectorización en background (no esperamos)
  await supabase.functions.invoke('vectorizar-propiedades', {
    body: { tenant_id: perfil.tenant_id },
  }).catch(() => null)

  return NextResponse.json({ ok: true, sincronizadas })
}
