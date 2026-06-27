// Edge Function: Vectoriza propiedades para RAG pipeline
// Llamada tras sincronización con Tokko o al crear/editar una propiedad

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)
const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })

function textoPropiedadParaEmbedding(p: Record<string, unknown>): string {
  const partes = [
    p.titulo,
    p.tipo && `Tipo: ${p.tipo}`,
    p.operacion && `Operacion: ${p.operacion}`,
    p.precio && `Precio: ${p.precio} ${p.moneda ?? 'USD'}`,
    p.zona && `Zona: ${p.zona}`,
    p.direccion && `Direccion: ${p.direccion}`,
    p.dormitorios != null && `Dormitorios: ${p.dormitorios}`,
    p.banios != null && `Banos: ${p.banios}`,
    p.superficie_total != null && `Superficie: ${p.superficie_total}m2`,
    p.descripcion,
  ]
  return partes.filter(Boolean).join('. ')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  const { tenant_id, propiedad_id } = await req.json()

  // Obtener propiedades sin embedding (o una específica)
  let query = supabase
    .from('propiedades')
    .select('id, titulo, tipo, operacion, precio, moneda, zona, direccion, dormitorios, banios, superficie_total, descripcion')
    .is('embedding', null)
    .limit(50)

  if (tenant_id) query = query.eq('tenant_id', tenant_id)
  if (propiedad_id) query = query.eq('id', propiedad_id)

  const { data: propiedades } = await query

  if (!propiedades || propiedades.length === 0) {
    return new Response(JSON.stringify({ vectorizadas: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let vectorizadas = 0

  for (const propiedad of propiedades) {
    const texto = textoPropiedadParaEmbedding(propiedad as Record<string, unknown>)

    const respuesta = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texto,
    })

    const embedding = respuesta.data[0].embedding

    await supabase
      .from('propiedades')
      .update({ embedding })
      .eq('id', propiedad.id)

    vectorizadas++
  }

  return new Response(JSON.stringify({ vectorizadas }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
