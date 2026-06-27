// Edge Function: Receptor de webhooks de WhatsApp (Meta Cloud API)
// Crea contactos, conversaciones y mensajes automáticamente

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Verificación del webhook de Meta (GET)
function manejarVerificacion(req: Request): Response {
  const url = new URL(req.url)
  const modo = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  if (modo === 'subscribe' && token === Deno.env.get('META_VERIFY_TOKEN')) {
    return new Response(challenge, { status: 200 })
  }
  return new Response('Token inválido', { status: 403 })
}

// Verificar firma HMAC-SHA256 del payload de Meta
async function verificarFirmaMeta(req: Request, cuerpoTexto: string): Promise<boolean> {
  const firma = req.headers.get('x-hub-signature-256')
  if (!firma) return false

  const secreto = Deno.env.get('META_APP_SECRET') ?? ''
  const clave = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secreto),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const firmaCal = await crypto.subtle.sign('HMAC', clave, new TextEncoder().encode(cuerpoTexto))
  const firmaHex = 'sha256=' + Array.from(new Uint8Array(firmaCal))
    .map(b => b.toString(16).padStart(2, '0')).join('')

  return firma === firmaHex
}

// Buscar o crear tenant por número de teléfono de destino
async function obtenerTenantPorNumero(numeroTelefono: string): Promise<string | null> {
  const { data } = await supabase
    .from('integraciones')
    .select('tenant_id, credenciales')
    .eq('tipo', 'whatsapp')
    .eq('activa', true)

  if (!data) return null

  for (const integracion of data) {
    const creds = integracion.credenciales as Record<string, string>
    if (creds.phone_number_id === numeroTelefono || creds.numero === numeroTelefono) {
      return integracion.tenant_id
    }
  }
  return null
}

// Buscar o crear contacto
async function obtenerOCrearContacto(
  tenantId: string,
  telefono: string,
  nombre: string
): Promise<string> {
  const { data: contactoExistente } = await supabase
    .from('contactos')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('telefono', telefono)
    .single()

  if (contactoExistente) return contactoExistente.id

  const { data: nuevo } = await supabase
    .from('contactos')
    .insert({
      tenant_id: tenantId,
      nombre: nombre || telefono,
      telefono,
      canal_origen: 'whatsapp',
      etiquetas_smart: [],
      variables: {},
      etapa: 'nuevo',
    })
    .select('id')
    .single()

  return nuevo!.id
}

// Buscar o crear conversación activa
async function obtenerOCrearConversacion(
  tenantId: string,
  contactoId: string
): Promise<string> {
  const { data: convExistente } = await supabase
    .from('conversaciones')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('contacto_id', contactoId)
    .in('estado', ['ABIERTO', 'BOT'])
    .order('ultimo_mensaje_en', { ascending: false })
    .limit(1)
    .single()

  if (convExistente) return convExistente.id

  const { data: nueva } = await supabase
    .from('conversaciones')
    .insert({
      tenant_id: tenantId,
      contacto_id: contactoId,
      canal: 'whatsapp',
      estado: 'BOT',
    })
    .select('id')
    .single()

  return nueva!.id
}

// Determinar tipo de mensaje
function determinarTipo(mensaje: Record<string, unknown>): string {
  if (mensaje.text) return 'TEXTO'
  if (mensaje.image) return 'IMAGEN'
  if (mensaje.audio || mensaje.voice) return 'AUDIO'
  if (mensaje.document) return 'DOCUMENTO'
  return 'TEXTO'
}

// Extraer contenido del mensaje
function extraerContenido(mensaje: Record<string, unknown>): string {
  if (mensaje.text) return (mensaje.text as { body: string }).body
  if (mensaje.image) return (mensaje.image as { caption?: string }).caption ?? '[Imagen]'
  if (mensaje.audio || mensaje.voice) return '[Audio]'
  if (mensaje.document) return (mensaje.document as { filename?: string }).filename ?? '[Documento]'
  return '[Mensaje no soportado]'
}

// Disparar el agente IA si la conversación está en modo BOT
async function invocarAgenteIA(conversacionId: string, tenantId: string, mensajeUsuario: string) {
  try {
    await supabase.functions.invoke('agente-ia', {
      body: { conversacion_id: conversacionId, tenant_id: tenantId, mensaje: mensajeUsuario },
    })
  } catch (err) {
    console.error('Error invocando agente-ia:', err)
  }
}

// Handler principal
Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  // Verificación GET de Meta
  if (req.method === 'GET') {
    return manejarVerificacion(req)
  }

  if (req.method !== 'POST') {
    return new Response('Método no permitido', { status: 405 })
  }

  const cuerpoTexto = await req.text()

  // Verificar firma en producción
  const esProduccion = Deno.env.get('DENO_ENV') === 'production'
  if (esProduccion) {
    const firmaValida = await verificarFirmaMeta(req, cuerpoTexto)
    if (!firmaValida) {
      return new Response('Firma inválida', { status: 401 })
    }
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(cuerpoTexto)
  } catch {
    return new Response('JSON inválido', { status: 400 })
  }

  // Procesar mensajes entrantes
  const entradas = (payload.entry as Array<Record<string, unknown>>) ?? []

  for (const entrada of entradas) {
    const cambios = (entrada.changes as Array<Record<string, unknown>>) ?? []
    for (const cambio of cambios) {
      const valor = cambio.value as Record<string, unknown>
      if (!valor?.messages) continue

      const mensajes = valor.messages as Array<Record<string, unknown>>
      const metadatos = valor.metadata as Record<string, string>
      const numeroDestino = metadatos?.phone_number_id ?? ''

      for (const mensaje of mensajes) {
        const telefono = (mensaje.from as string) ?? ''
        const contactoMeta = ((valor.contacts as Array<Record<string, unknown>>) ?? [])[0]
        const nombre = (contactoMeta?.profile as Record<string, string>)?.name ?? telefono

        // Encontrar tenant
        const tenantId = await obtenerTenantPorNumero(numeroDestino)

        // Si no hay tenant configurado, intentar usar el primero activo (modo dev)
        let tenantFinal = tenantId
        if (!tenantFinal) {
          const { data: tenants } = await supabase.from('tenants').select('id').limit(1).single()
          tenantFinal = tenants?.id ?? null
        }
        if (!tenantFinal) continue

        // Crear/obtener contacto y conversación
        const contactoId = await obtenerOCrearContacto(tenantFinal, telefono, nombre)
        const conversacionId = await obtenerOCrearConversacion(tenantFinal, contactoId)

        // Guardar mensaje
        const tipo = determinarTipo(mensaje)
        const contenido = extraerContenido(mensaje)

        await supabase.from('mensajes').insert({
          conversacion_id: conversacionId,
          rol: 'USUARIO',
          contenido,
          tipo,
          metadatos: {
            wamid: mensaje.id,
            timestamp: mensaje.timestamp,
          },
        })

        // Verificar si la conversación está en modo BOT
        const { data: conv } = await supabase
          .from('conversaciones')
          .select('estado')
          .eq('id', conversacionId)
          .single()

        if (conv?.estado === 'BOT' && tipo === 'TEXTO') {
          await invocarAgenteIA(conversacionId, tenantFinal, contenido)
        }
      }
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
