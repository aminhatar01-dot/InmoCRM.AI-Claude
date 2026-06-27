// Edge Function: Motor de seguimientos automáticos
// Invocada por pg_cron cada hora para revisar recordatorios pendientes

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)
const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  const ahora = new Date().toISOString()

  // Buscar recordatorios pendientes que ya vencieron
  const { data: recordatorios } = await supabase
    .from('recordatorios')
    .select('*, contactos(nombre, telefono, tenant_id, variables)')
    .eq('estado', 'PENDIENTE')
    .lte('programado_en', ahora)
    .limit(50)

  if (!recordatorios || recordatorios.length === 0) {
    return new Response(JSON.stringify({ procesados: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let procesados = 0

  for (const recordatorio of recordatorios) {
    const contacto = recordatorio.contactos as Record<string, unknown>
    if (!contacto) continue

    const tenantId = contacto.tenant_id as string

    // Verificar saldo de tokens
    const { data: tenant } = await supabase
      .from('tenants')
      .select('saldo_tokens_ia, configuracion')
      .eq('id', tenantId)
      .single()

    if (!tenant || tenant.saldo_tokens_ia <= 0) continue

    // Buscar conversación activa del contacto
    const { data: conversacion } = await supabase
      .from('conversaciones')
      .select('id, estado')
      .eq('contacto_id', recordatorio.contacto_id)
      .in('estado', ['ABIERTO', 'BOT'])
      .order('ultimo_mensaje_en', { ascending: false })
      .limit(1)
      .single()

    // Personalizar mensaje con variables del contacto
    const variables = (contacto.variables as Record<string, string>) ?? {}
    let mensajePersonalizado = recordatorio.mensaje

    // Reemplazar variables en el mensaje
    for (const [clave, valor] of Object.entries(variables)) {
      mensajePersonalizado = mensajePersonalizado.replace(`{${clave}}`, String(valor))
    }
    mensajePersonalizado = mensajePersonalizado.replace('{nombre}', String(contacto.nombre ?? ''))

    if (conversacion) {
      // Reiniciar conversación existente en modo BOT y enviar recordatorio
      await supabase
        .from('conversaciones')
        .update({ estado: 'BOT' })
        .eq('id', conversacion.id)

      await supabase.from('mensajes').insert({
        conversacion_id: conversacion.id,
        rol: 'BOT',
        contenido: mensajePersonalizado,
        tipo: 'TEXTO',
        metadatos: { tipo: 'recordatorio', recordatorio_id: recordatorio.id },
      })

      // Disparar agente IA para continuar la conversación
      await supabase.functions.invoke('agente-ia', {
        body: {
          conversacion_id: conversacion.id,
          tenant_id: tenantId,
          mensaje: `[RECORDATORIO AUTOMÁTICO] Continuando con ${contacto.nombre}: ${mensajePersonalizado}`,
        },
      })
    }

    // Marcar recordatorio como enviado
    await supabase
      .from('recordatorios')
      .update({ estado: 'ENVIADO' })
      .eq('id', recordatorio.id)

    procesados++
  }

  return new Response(JSON.stringify({ procesados }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
