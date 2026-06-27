// Edge Function: Broadcast masivo de WhatsApp para campañas
// Recibe campana_id, resuelve contactos del segmento y envía uno a uno

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface Segmento {
  etapas?: string[]
  etiquetas?: string[]
  canales?: string[]
}

interface Contacto {
  id: string
  nombre: string
  telefono: string | null
  canal_origen: string
  etiquetas_smart: string[]
  variables: Record<string, string>
}

async function enviarMensajeWhatsApp(
  telefono: string,
  mensaje: string,
  metaToken: string,
  phoneNumberId: string
): Promise<boolean> {
  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${metaToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: telefono.replace(/\D/g, ''),
      type: 'text',
      text: { preview_url: false, body: mensaje },
    }),
  })
  return resp.ok
}

function personalizarMensaje(mensaje: string, contacto: Contacto): string {
  let resultado = mensaje
  resultado = resultado.replace(/\{nombre\}/g, contacto.nombre ?? '')
  for (const [clave, valor] of Object.entries(contacto.variables ?? {})) {
    resultado = resultado.replace(new RegExp(`\\{${clave}\\}`, 'g'), String(valor))
  }
  return resultado
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  const { campana_id, tenant_id, mensaje, segmento = {} } = await req.json() as {
    campana_id: string
    tenant_id: string
    mensaje: string
    segmento: Segmento
  }

  // Obtener credenciales WhatsApp del tenant
  const { data: integracion } = await supabase
    .from('integraciones')
    .select('credenciales')
    .eq('tenant_id', tenant_id)
    .eq('tipo', 'whatsapp')
    .eq('activa', true)
    .single()

  const credenciales = integracion?.credenciales as Record<string, string> | null
  const metaToken = credenciales?.token_acceso
  const phoneNumberId = credenciales?.phone_number_id

  if (!metaToken || !phoneNumberId) {
    await supabase.from('campanas').update({ estado: 'BORRADOR' }).eq('id', campana_id)
    return new Response(JSON.stringify({ error: 'WhatsApp no configurado' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Construir query de contactos según el segmento
  let query = supabase
    .from('contactos')
    .select('id, nombre, telefono, canal_origen, etiquetas_smart, variables')
    .eq('tenant_id', tenant_id)
    .not('telefono', 'is', null)

  const seg = segmento as Segmento
  if (seg.etapas?.length) {
    query = query.in('etapa', seg.etapas)
  }
  if (seg.canales?.length) {
    query = query.in('canal_origen', seg.canales)
  }
  if (seg.etiquetas?.length) {
    query = query.overlaps('etiquetas_smart', seg.etiquetas)
  }

  const { data: contactos } = await query.limit(1000)

  if (!contactos || contactos.length === 0) {
    await supabase.from('campanas').update({ estado: 'ENVIADA', total_enviados: 0 }).eq('id', campana_id)
    return new Response(JSON.stringify({ enviados: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let enviados = 0
  let errores = 0

  for (const contacto of contactos as Contacto[]) {
    if (!contacto.telefono) continue

    const mensajePersonalizado = personalizarMensaje(mensaje, contacto)

    // Rate limiting: 80 msg/seg Meta API
    await new Promise(r => setTimeout(r, 50))

    const ok = await enviarMensajeWhatsApp(contacto.telefono, mensajePersonalizado, metaToken, phoneNumberId)

    if (ok) {
      enviados++
      // Registrar el mensaje en la conversación correspondiente
      const { data: conv } = await supabase
        .from('conversaciones')
        .select('id')
        .eq('contacto_id', contacto.id)
        .eq('canal', 'whatsapp')
        .order('ultimo_mensaje_en', { ascending: false })
        .limit(1)
        .single()

      if (conv) {
        await supabase.from('mensajes').insert({
          conversacion_id: conv.id,
          rol: 'AGENTE',
          contenido: mensajePersonalizado,
          tipo: 'TEXTO',
          metadatos: { campana_id, tipo: 'broadcast' },
        })
      }
    } else {
      errores++
    }
  }

  // Actualizar estado final de la campaña
  await supabase
    .from('campanas')
    .update({ estado: 'ENVIADA', total_enviados: enviados })
    .eq('id', campana_id)

  // Notificar al tenant
  await supabase.from('notificaciones').insert({
    tenant_id,
    tipo: 'campana_completada',
    titulo: 'Campaña enviada',
    cuerpo: `Se enviaron ${enviados} mensajes (${errores} errores).`,
    datos: { campana_id, enviados: String(enviados), errores: String(errores) },
  })

  return new Response(JSON.stringify({ enviados, errores }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
