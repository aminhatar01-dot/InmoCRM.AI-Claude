'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, MoreVertical, Phone } from 'lucide-react'
import { cn } from '@/lib/utilidades'
import { BurbujaChat, IndicadorBot } from './BurbujaChat'
import { InsigniaCanal } from './InsigniaCanal'
import { usarMensajes } from '@/hooks/usarMensajes'
import type { Conversacion, CanalOrigen } from '@/types'
import { crearClienteNavegador } from '@/lib/supabase/cliente'

interface HiloMensajesProps {
  conversacion: Conversacion | null
  tenantId: string
  nombreAgente?: string
}

export function HiloMensajes({ conversacion, tenantId, nombreAgente = 'Sofía' }: HiloMensajesProps) {
  const [textoMensaje, setTextoMensaje] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = crearClienteNavegador()

  const {
    mensajes,
    cargando,
    enviando,
    botEscribiendo,
    enviarMensaje,
    contenedorRef,
  } = usarMensajes(conversacion?.id ?? null)

  // Cambiar estado BOT/HUMANO
  async function toggleModo() {
    if (!conversacion) return
    const nuevoEstado = conversacion.estado === 'BOT' ? 'HUMANO' : 'BOT'
    await supabase
      .from('conversaciones')
      .update({ estado: nuevoEstado })
      .eq('id', conversacion.id)
  }

  // Enviar mensaje del agente
  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault()
    if (!textoMensaje.trim() || !conversacion) return
    const texto = textoMensaje
    setTextoMensaje('')
    await enviarMensaje(texto, tenantId)
    inputRef.current?.focus()
  }

  if (!conversacion) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4">
            <Bot size={28} className="text-violet-300" />
          </div>
          <p className="font-medium text-gray-500">Seleccioná una conversación</p>
          <p className="text-sm mt-1">Los mensajes aparecerán aquí</p>
        </div>
      </div>
    )
  }

  const contacto = conversacion.contacto
  const esBotActivo = conversacion.estado === 'BOT'

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
      {/* Header del hilo */}
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-sm flex-shrink-0">
            {contacto?.nombre?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '??'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-sm">{contacto?.nombre ?? 'Contacto'}</h3>
              <InsigniaCanal canal={conversacion.canal as CanalOrigen} tamanio="sm" />
            </div>
            <p className="text-xs text-gray-500">{contacto?.telefono ?? contacto?.email ?? ''}</p>
          </div>
        </div>

        {/* Toggle BOT/HUMANO */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleModo}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
              esBotActivo
                ? 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            )}
          >
            {esBotActivo ? (
              <><Bot size={13} /> IA activa — Tomar control</>
            ) : (
              <><User size={13} /> Tú en control — Devolver a IA</>
            )}
          </button>
          <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Hilo de mensajes */}
      <div
        ref={contenedorRef}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-0.5"
      >
        {cargando ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : mensajes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center text-gray-400">
            <div>
              <p className="text-sm font-medium">Sin mensajes todavía</p>
              <p className="text-xs mt-1">Los mensajes del contacto aparecerán aquí</p>
            </div>
          </div>
        ) : (
          <>
            {mensajes.map(mensaje => (
              <BurbujaChat
                key={mensaje.id}
                mensaje={mensaje}
                nombreAgente={nombreAgente}
              />
            ))}
            {botEscribiendo && <IndicadorBot nombreAgente={nombreAgente} />}
          </>
        )}
      </div>

      {/* Área de entrada de mensaje */}
      <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
        {/* Aviso modo IA */}
        {esBotActivo && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-violet-50 rounded-lg border border-violet-100">
            <Bot size={13} className="text-violet-600 flex-shrink-0" />
            <p className="text-xs text-violet-700">
              La IA está respondiendo. Hacé clic en <strong>Tomar control</strong> para responder vos.
            </p>
          </div>
        )}

        <form onSubmit={manejarEnvio} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={textoMensaje}
            onChange={e => setTextoMensaje(e.target.value)}
            disabled={esBotActivo || enviando}
            placeholder={
              esBotActivo
                ? 'La IA está en control...'
                : 'Escribí un mensaje como agente...'
            }
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50 disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={!textoMensaje.trim() || esBotActivo || enviando}
            className="w-10 h-10 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            {enviando ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>

        {/* Respuestas rápidas (placeholder) */}
        <div className="flex gap-2 mt-2">
          {['Hola, en qué puedo ayudarte', 'Te paso más info', 'Agendamos una visita'].map(txt => (
            <button
              key={txt}
              onClick={() => setTextoMensaje(txt)}
              disabled={esBotActivo}
              className="text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full disabled:opacity-40 transition-colors truncate max-w-[130px]"
            >
              {txt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
