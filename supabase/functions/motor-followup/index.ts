// Edge Function: Motor de follow-up automático
// Invocada por pg_cron cada 30 minutos
// Procesa ejecuciones_followup con proximo_paso_en <= NOW()

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface Paso {
  dias: number
  mensaje: string
  tipo: 'whatsapp' | 'recordatorio'
}

interface EjecucionConJoins {
  id: string
  tenant_id: string
  paso_actual: number
  contacto_id: string
  secuencia_id: string
  secuencias_followup: {
    pasos: Paso[]
    nombre: string
  }
  contactos: {
    nombre: string
    telefono: string | null
    variables: Record<string, string>
  }
}

async function enviarWhatsApp(
  telefono: string,
  mensaje: string,
  tenantId: string
): Promise<boolean> {
  const { data: integracion } = await supabase
    .from('integraciones')
    .select('credenciales')
    .eq('tenant_id', tenantId)
    .eq('tipo', 'whatsapp')
    .eq('activa', true)
    .single()

  const creds = integracion?.credenciales as Record<string, string> | null
  if (!creds?.token_acceso || !creds?.phone_number_id) return false

  const resp = await fetch(
    `https://graph.facebook.com/v18.0/${creds.phone_number_id}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${creds.token_acceso}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: telefono.replace(/\D/g, ''),
        type: 'text',
        text: { body: mensaje },
      }),
    }
  )
  return resp.ok
}

function personalizarMensaje(template: string, variables: Record<string, string>, nombre: string): string {
  let msg = template.replace(/\{nombre\}/g, nombre)
  for (const [k, v] of Object.entries(variables)) {
    msg = msg.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
  }
  return msg
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  const ahora = new Date().toISOString()

  const { data: ejecuciones } = await supabase
    .from('ejecuciones_followup')
    .select(`
      id, tenant_id, paso_actual, contacto_id, secuencia_id,
      secuencias_followup(pasos, nombre),
      contactos(nombre, telefono, variables)
    `)
    .eq('estado', 'ACTIVA')
    .lte('proximo_paso_en', ahora)
    .limit(100)

  if (!ejecuciones || ejecuciones.length === 0) {
    return new Response(JSON.stringify({ procesadas: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let procesadas = 0

  for (const ej of ejecuciones as unknown as EjecucionConJoins[]) {
    const secuencia = ej.secuencias_followup
    const contacto = ej.contactos
    const pasos = secuencia?.pasos ?? []

    if (!contacto || !secuencia) continue

    const pasoActual = pasos[ej.paso_actual]
    if (!pasoActual) {
      // Secuencia completada
      await supabase.from('ejecuciones_followup').update({ estado: 'COMPLETADA' }).eq('id', ej.id)
      continue
    }

    const mensaje = personalizarMensaje(pasoActual.mensaje, contacto.variables ?? {}, contacto.nombre)

    if (pasoActual.tipo === 'whatsapp' && contacto.telefono) {
      await enviarWhatsApp(contacto.telefono, mensaje, ej.tenant_id)

      // Registrar en conversación activa
      const { data: conv } = await supabase
        .from('conversaciones')
        .select('id')
        .eq('contacto_id', ej.contacto_id)
        .in('estado', ['ABIERTO', 'BOT'])
        .order('ultimo_mensaje_en', { ascending: false })
        .limit(1)
        .single()

      if (conv) {
        await supabase.from('mensajes').insert({
          conversacion_id: conv.id,
          rol: 'BOT',
          contenido: mensaje,
          tipo: 'TEXTO',
          metadatos: { tipo: 'followup', secuencia_id: ej.secuencia_id, paso: ej.paso_actual },
        })
      }
    } else if (pasoActual.tipo === 'recordatorio') {
      await supabase.from('recordatorios').insert({
        tenant_id: ej.tenant_id,
        contacto_id: ej.contacto_id,
        programado_en: ahora,
        mensaje,
        disparado_por: 'IA',
        estado: 'ENVIADO',
      })
    }

    // Avanzar al siguiente paso
    const siguientePaso = ej.paso_actual + 1
    const hayMasPasos = siguientePaso < pasos.length

    if (hayMasPasos) {
      const diasSiguiente = pasos[siguientePaso].dias
      const proximoEn = new Date(Date.now() + diasSiguiente * 86400 * 1000).toISOString()
      await supabase.from('ejecuciones_followup').update({
        paso_actual: siguientePaso,
        proximo_paso_en: proximoEn,
      }).eq('id', ej.id)
    } else {
      await supabase.from('ejecuciones_followup').update({ estado: 'COMPLETADA' }).eq('id', ej.id)
    }

    procesadas++
  }

  return new Response(JSON.stringify({ procesadas }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
