'use client'

import { Search, Filter, Bot, User } from 'lucide-react'
import { cn, tiempoRelativo } from '@/lib/utilidades'
import { InsigniaCanal } from './InsigniaCanal'
import type { Conversacion, FiltrosBandeja, CanalOrigen } from '@/types'

interface PanelConversacionesProps {
  conversaciones: Conversacion[]
  conversacionSeleccionada: string | null
  onSeleccionar: (id: string) => void
  filtros: FiltrosBandeja
  onFiltros: (f: FiltrosBandeja) => void
  cargando: boolean
}

const CANALES: { id: CanalOrigen; label: string; emoji: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp', emoji: '💬' },
  { id: 'instagram', label: 'Instagram', emoji: '📸' },
  { id: 'facebook', label: 'Facebook', emoji: '👥' },
  { id: 'web', label: 'Web', emoji: '🌐' },
]

const COLORES_ESTADO: Record<string, string> = {
  BOT: 'bg-violet-100 text-violet-700',
  HUMANO: 'bg-emerald-100 text-emerald-700',
  ABIERTO: 'bg-blue-100 text-blue-700',
  CERRADO: 'bg-gray-100 text-gray-500',
}

export function PanelConversaciones({
  conversaciones,
  conversacionSeleccionada,
  onSeleccionar,
  filtros,
  onFiltros,
  cargando,
}: PanelConversacionesProps) {
  return (
    <div className="flex flex-col h-full border-r border-gray-200 bg-white w-80 flex-shrink-0">
      {/* Cabecera */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Bandeja</h2>
          <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
            {conversaciones.length}
          </span>
        </div>

        {/* Búsqueda */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filtros.busqueda ?? ''}
            onChange={e => onFiltros({ ...filtros, busqueda: e.target.value })}
            placeholder="Buscar contacto..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50"
          />
        </div>

        {/* Filtros de canal */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => onFiltros({ ...filtros, canal: undefined })}
            className={cn(
              'text-xs px-2.5 py-1 rounded-full border transition-colors',
              !filtros.canal ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'
            )}
          >
            Todos
          </button>
          {CANALES.map(({ id, emoji }) => (
            <button
              key={id}
              onClick={() => onFiltros({ ...filtros, canal: filtros.canal === id ? undefined : id })}
              className={cn(
                'text-xs px-2.5 py-1 rounded-full border transition-colors',
                filtros.canal === id ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de conversaciones */}
      <div className="flex-1 overflow-y-auto">
        {cargando ? (
          // Skeletons de carga
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 border-b border-gray-50 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-100 rounded w-full" />
                </div>
              </div>
            </div>
          ))
        ) : conversaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Search size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">Sin conversaciones</p>
            <p className="text-xs text-gray-400 mt-1">
              {filtros.busqueda ? 'No se encontraron resultados' : 'Conectá un canal para empezar'}
            </p>
          </div>
        ) : (
          conversaciones.map(conv => {
            const contacto = conv.contacto
            const activa = conv.id === conversacionSeleccionada
            const iniciales = contacto?.nombre
              ? contacto.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              : '??'

            return (
              <button
                key={conv.id}
                onClick={() => onSeleccionar(conv.id)}
                className={cn(
                  'w-full text-left px-4 py-3.5 border-b border-gray-50 transition-colors hover:bg-gray-50',
                  activa ? 'bg-violet-50 border-l-2 border-l-violet-600' : ''
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold',
                      activa ? 'bg-violet-200 text-violet-700' : 'bg-gray-100 text-gray-600'
                    )}>
                      {iniciales}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <InsigniaCanal canal={conv.canal as CanalOrigen} tamanio="sm" />
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={cn(
                        'text-sm font-medium truncate',
                        activa ? 'text-violet-900' : 'text-gray-900'
                      )}>
                        {contacto?.nombre ?? conv.canal}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {tiempoRelativo(conv.ultimo_mensaje_en)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 truncate">
                      {conv.ultimo_mensaje ?? 'Sin mensajes'}
                    </p>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={cn(
                        'text-xs px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1',
                        COLORES_ESTADO[conv.estado]
                      )}>
                        {conv.estado === 'BOT' ? <><Bot size={9} /> IA</> : <><User size={9} /> {conv.estado}</>}
                      </span>
                      {contacto?.etiquetas_smart?.slice(0, 2).map(etiq => (
                        <span key={etiq} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full truncate max-w-[70px]">
                          {etiq}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
