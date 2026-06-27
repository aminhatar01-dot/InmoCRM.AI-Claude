'use client'

import { Phone, MessageCircle, Tag, Clock } from 'lucide-react'
import { cn, tiempoRelativo } from '@/lib/utilidades'
import type { Contacto } from '@/types'

interface TarjetaLeadProps {
  contacto: Contacto
  onAbrir: (c: Contacto) => void
  onMover: (id: string, etapa: string) => void
  etapas: string[]
}

const EMOJIS_CANAL: Record<string, string> = {
  whatsapp: '💬',
  instagram: '📸',
  facebook: '👥',
  web: '🌐',
  mercadolibre: '🛒',
  manual: '✏️',
}

const COLORES_ETIQUETA = [
  'bg-violet-50 text-violet-700 border-violet-100',
  'bg-emerald-50 text-emerald-700 border-emerald-100',
  'bg-amber-50 text-amber-700 border-amber-100',
  'bg-blue-50 text-blue-700 border-blue-100',
]

export function TarjetaLead({ contacto, onAbrir, onMover, etapas }: TarjetaLeadProps) {
  const iniciales = contacto.nombre
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      onClick={() => onAbrir(contacto)}
    >
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-semibold flex-shrink-0">
            {iniciales}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{contacto.nombre}</p>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span>{EMOJIS_CANAL[contacto.canal_origen] ?? '💬'}</span>
              <span>{contacto.telefono ?? contacto.email ?? 'Sin contacto'}</span>
            </div>
          </div>
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
          <Clock size={10} />
          {tiempoRelativo(contacto.creado_en)}
        </span>
      </div>

      {/* Notas */}
      {contacto.notas && (
        <p className="text-xs text-gray-500 mb-2.5 line-clamp-2">{contacto.notas}</p>
      )}

      {/* Etiquetas */}
      {contacto.etiquetas_smart?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {contacto.etiquetas_smart.slice(0, 3).map((etiq, i) => (
            <span key={etiq} className={cn(
              'text-xs px-2 py-0.5 rounded-full border font-medium',
              COLORES_ETIQUETA[i % COLORES_ETIQUETA.length]
            )}>
              {etiq}
            </span>
          ))}
          {contacto.etiquetas_smart.length > 3 && (
            <span className="text-xs text-gray-400">+{contacto.etiquetas_smart.length - 3}</span>
          )}
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        {contacto.telefono ? (
          <a
            href={`https://wa.me/${contacto.telefono.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
          >
            <Phone size={11} /> WhatsApp
          </a>
        ) : <div />}

        {/* Mover a siguiente etapa */}
        {(() => {
          const idx = etapas.indexOf(contacto.etapa)
          const siguiente = etapas[idx + 1]
          if (!siguiente) return null
          return (
            <button
              onClick={e => { e.stopPropagation(); onMover(contacto.id, siguiente) }}
              className="text-xs text-violet-600 hover:text-violet-700 font-medium"
            >
              Avanzar →
            </button>
          )
        })()}
      </div>
    </div>
  )
}
