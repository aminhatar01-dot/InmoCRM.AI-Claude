'use client'

import { Bot, User, Headphones } from 'lucide-react'
import { cn, tiempoRelativo, COLORES_CANAL } from '@/lib/utilidades'
import type { Mensaje } from '@/types'

interface BurbujaChatProps {
  mensaje: Mensaje
  nombreAgente?: string
}

export function BurbujaChat({ mensaje, nombreAgente = 'Sofía' }: BurbujaChatProps) {
  const esUsuario = mensaje.rol === 'USUARIO'
  const esBot = mensaje.rol === 'BOT'
  const esAgente = mensaje.rol === 'AGENTE'

  return (
    <div className={cn('flex gap-2 mb-3', esUsuario ? 'justify-start' : 'justify-end')}>
      {/* Avatar izquierdo (usuario) */}
      {esUsuario && (
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
          <User size={13} className="text-gray-500" />
        </div>
      )}

      <div className={cn('max-w-[72%]', esUsuario ? 'items-start' : 'items-end', 'flex flex-col gap-1')}>
        {/* Badge del remitente */}
        <div className={cn('flex items-center gap-1', esUsuario ? 'flex-row' : 'flex-row-reverse')}>
          {esBot && (
            <span className="text-xs text-violet-600 font-medium flex items-center gap-1">
              <Bot size={11} /> {nombreAgente} IA
            </span>
          )}
          {esAgente && (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <Headphones size={11} /> Agente
            </span>
          )}
        </div>

        {/* Burbuja de mensaje */}
        <div className={cn(
          'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm',
          esUsuario
            ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
            : esBot
              ? 'bg-violet-600 text-white rounded-tr-none'
              : 'bg-emerald-600 text-white rounded-tr-none'
        )}>
          {mensaje.tipo === 'IMAGEN' ? (
            <div className="flex items-center gap-2 text-sm opacity-80">
              📷 Imagen
            </div>
          ) : mensaje.tipo === 'AUDIO' ? (
            <div className="flex items-center gap-2 text-sm opacity-80">
              🎤 Audio
            </div>
          ) : mensaje.tipo === 'DOCUMENTO' ? (
            <div className="flex items-center gap-2 text-sm opacity-80">
              📄 {mensaje.contenido}
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{mensaje.contenido}</p>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-gray-400">
          {tiempoRelativo(mensaje.timestamp)}
        </span>
      </div>

      {/* Avatar derecho (bot/agente) */}
      {!esUsuario && (
        <div className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1',
          esBot ? 'bg-violet-100' : 'bg-emerald-100'
        )}>
          {esBot
            ? <Bot size={13} className="text-violet-600" />
            : <Headphones size={13} className="text-emerald-600" />
          }
        </div>
      )}
    </div>
  )
}

// Indicador "bot escribiendo..."
export function IndicadorBot({ nombreAgente = 'Sofía' }: { nombreAgente?: string }) {
  return (
    <div className="flex gap-2 mb-3 justify-end">
      <div className="max-w-[72%] flex flex-col items-end gap-1">
        <span className="text-xs text-violet-600 font-medium flex items-center gap-1">
          <Bot size={11} /> {nombreAgente} IA
        </span>
        <div className="bg-violet-100 px-4 py-3 rounded-2xl rounded-tr-none">
          <div className="indicador-bot flex items-center gap-0.5">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
      <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-1">
        <Bot size={13} className="text-violet-600" />
      </div>
    </div>
  )
}
