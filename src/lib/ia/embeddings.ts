import { crearClienteNavegador } from '@/lib/supabase/cliente'

// Vectorizar propiedades del catálogo y guardar embeddings en Supabase
export async function vectorizarPropiedad(propiedadId: string, texto: string): Promise<void> {
  const respuesta = await fetch('/api/ia/embedding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto }),
  })

  if (!respuesta.ok) throw new Error('Error generando embedding')

  const { embedding } = await respuesta.json()
  const supabase = crearClienteNavegador()

  await supabase
    .from('propiedades')
    .update({ embedding })
    .eq('id', propiedadId)
}

// Texto para vectorizar una propiedad (concatena campos relevantes)
export function textoPropiedadParaEmbedding(propiedad: {
  titulo: string
  tipo: string
  precio: number
  zona: string
  dormitorios?: number
  banos?: number
  descripcion?: string
}): string {
  return [
    propiedad.titulo,
    `${propiedad.tipo} en ${propiedad.zona}`,
    `Precio: $${propiedad.precio.toLocaleString('es-AR')}`,
    propiedad.dormitorios ? `${propiedad.dormitorios} dormitorios` : '',
    propiedad.banos ? `${propiedad.banos} baños` : '',
    propiedad.descripcion ?? '',
  ].filter(Boolean).join('. ')
}
