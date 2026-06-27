// Edge Function: Detecta intenciones de recordatorio en mensajes de usuarios
// Invocada por webhook-whatsapp cuando llega un mensaje de tipo USUARIO
// Si detecta fecha/hora en el texto, crea un recordatorio automático

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)
const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })

const PROMPT_DETECCION = `Eres un extractor de fechas y recordatorios para un CRM inmobiliario.
Analiza el siguiente mensaje y determina si el usuario está pidiendo o mencionando:
1. Una cita o visita a una propiedad
2. Un recordatorio para contactar
3. Una fecha o plazo específico

Responde SOLO con JSON en este formato exacto:
{
  "detectado": true/false,
  "tipo": "visita" | "recordatorio" | "plazo",
  "fecha_hora": "ISO 8601 o null",
  "descripcion": "descripción breve del recordatorio",
  "confianza": 0.0 a 1.0
}

Si no hay ninguna fecha o recordatorio, responde: {"detectado": false}`

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  const { mensaje_id, conversacion_id, tenant_id, contenido, contacto_id } = await req.json()

  // Solo procesar si el contenido parece tener intención de fecha
  const palabrasClave = ['mañana', 'manana', 'hoy', 'lunes', 'martes', 'miercoles', 'jueves',
    'viernes', 'sabado', 'domingo', 'semana', 'mes', 'visita', 'cita', 'reunión',
    'reunion', 'agendar', 'hora', 'tarde', 'mañana', 'dia', 'próximo', 'proximo']

  const contenidoLower = (contenido as string).toLowerCase()
  const tieneKeyword = palabrasClave.some(k => contenidoLower.includes(k))

  if (!tieneKeyword) {
    return new Response(JSON.stringify({ detectado: false }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const respuesta = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: PROMPT_DETECCION },
      { role: 'user', content: `Mensaje: "${contenido}"\nFecha actual: ${new Date().toISOString()}` },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
    max_tokens: 200,
  })

  let resultado: Record<string, unknown>
  try {
    resultado = JSON.parse(respuesta.choices[0].message.content ?? '{}')
  } catch {
    return new Response(JSON.stringify({ detectado: false }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!resultado.detectado || (resultado.confianza as number) < 0.7) {
    return new Response(JSON.stringify({ detectado: false }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Crear recordatorio automático
  const { data: recordatorio } = await supabase.from('recordatorios').insert({
    tenant_id,
    contacto_id,
    programado_en: resultado.fecha_hora ?? new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    mensaje: resultado.descripcion as string,
    disparado_por: 'IA',
    estado: 'PENDIENTE',
  }).select().single()

  // Crear notificación para el equipo
  await supabase.from('notificaciones').insert({
    tenant_id,
    tipo: 'recordatorio_detectado',
    titulo: 'Recordatorio detectado por IA',
    cuerpo: `La IA detectó: "${resultado.descripcion}"`,
    datos: {
      conversacion_id,
      contacto_id,
      recordatorio_id: (recordatorio as Record<string, string>)?.id ?? '',
    },
  })

  return new Response(JSON.stringify({ detectado: true, recordatorio }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
