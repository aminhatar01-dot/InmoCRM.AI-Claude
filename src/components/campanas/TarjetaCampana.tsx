'use client'

import { Send, Users, TrendingUp, Clock, Trash2, PlayCircle, Eye } from 'lucide-react'
import { cn, formatearFechaHora, tiempoRelativo } from '@/lib/utilidades'
import type { Campana } from '@/types'

interface TarjetaCampanaProps {
  campana: Campana
  onLanzar: (id: string) => void
  onEliminar: (id: string) => void
  onVer: (c: Campana) => void
  lanzando: boolean
}

const ESTADO_CONFIG: Record<string, { label: string; clase: string; icono: string }> = {
  BORRADOR: { label: 'Borrador', clase: 'bg-gray-100 text-gray-600', icono: '📝' },
  EN_PROCESO: { label: 'Enviando...', clase: 'bg-amber-100 text-amber-700', icono: '⏳' },
  ENVIADA: { label: 'Enviada', clase: 'bg-emerald-100 text-emerald-700', icono: '✅' },
  PAUSADA: { label: 'Pausada', clase: 'bg-orange-100 text-orange-700', icono: '⏸' },
}

export function TarjetaCampana({ campana, onLanzar, onEliminar, onVer, lanzando }: TarjetaCampanaProps) {
  const config = ESTADO_CONFIG[campana.estado] ?? ESTADO_CONFIG.BORRADOR
  const tasaRespuesta = campana.total_enviados > 0
    ? Math.round((campana.total_respondidos / campana.total_enviados) * 100)
    : 0

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 group">
      {/* Cabecera */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-medium', config.clase)}>
              {config.icono} {config.label}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 truncate">{campana.nombre}</h3>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          <button
            onClick={() => onVer(campana)}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
            title="Ver detalles"
          >
            <Eye size={15} />
          </button>
          {campana.estado === 'BORRADOR' && (
            <button
              onClick={() => onEliminar(campana.id)}
              className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400"
              title="Eliminar"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Mensaje preview */}
      <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
        {campana.mensaje}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Users size={13} className="text-gray-400" />
          <span className="font-medium">{campana.total_enviados}</span>
          <span className="text-gray-400">enviados</span>
        </div>
        {campana.total_enviados > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <TrendingUp size={13} className="text-emerald-500" />
            <span className="font-medium text-emerald-600">{tasaRespuesta}%</span>
            <span className="text-gray-400">respondieron</span>
          </div>
        )}
        {campana.programada_en && campana.estado === 'BORRADOR' && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock size={11} />
            <span>{formatearFechaHora(campana.programada_en)}</span>
          </div>
        )}
      </div>

      {/* Barra de progreso tasa respuesta */}
      {campana.total_enviados > 0 && (
        <div className="mb-4">
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${tasaRespuesta}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{tiempoRelativo(campana.creado_en)}</span>
        {campana.estado === 'BORRADOR' && (
          <button
            onClick={() => onLanzar(campana.id)}
            disabled={lanzando}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium transition-colors"
          >
            <PlayCircle size={14} />
            {lanzando ? 'Enviando...' : 'Lanzar campaña'}
          </button>
        )}
        {campana.estado === 'EN_PROCESO' && (
          <div className="flex items-center gap-2 text-amber-600 text-sm">
            <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            Enviando mensajes...
          </div>
        )}
        {campana.estado === 'ENVIADA' && (
          <span className="text-xs text-emerald-600 font-medium">
            Completada
          </span>
        )}
      </div>
    </div>
  )
}
