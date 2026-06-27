'use client'

import { useState } from 'react'
import { User, Phone, Mail, Tag, Clock, Building2, ChevronDown, ChevronUp } from 'lucide-react'
import { cn, formatearFecha } from '@/lib/utilidades'
import { InsigniaCanal } from './InsigniaCanal'
import type { Contacto, CanalOrigen } from '@/types'

interface FichaContactoProps {
  contacto: Contacto | null
  estadoConversacion: string
  onCambiarEtapa: (etapa: string) => void
}

const ETAPAS = ['nuevo', 'interesado', 'visita_agendada', 'propuesta_enviada', 'cerrado', 'perdido']
const ETAPAS_LABELS: Record<string, string> = {
  nuevo: 'Nuevo',
  interesado: 'Interesado',
  visita_agendada: 'Visita agendada',
  propuesta_enviada: 'Propuesta enviada',
  cerrado: 'Cerrado',
  perdido: 'Perdido',
}

const ETAPAS_COLORES: Record<string, string> = {
  nuevo: 'bg-gray-100 text-gray-600',
  interesado: 'bg-blue-100 text-blue-700',
  visita_agendada: 'bg-amber-100 text-amber-700',
  propuesta_enviada: 'bg-violet-100 text-violet-700',
  cerrado: 'bg-emerald-100 text-emerald-700',
  perdido: 'bg-red-100 text-red-600',
}

export function FichaContacto({ contacto, estadoConversacion, onCambiarEtapa }: FichaContactoProps) {
  const [variablesExpandidas, setVariablesExpandidas] = useState(true)

  if (!contacto) {
    return (
      <div className="w-72 flex-shrink-0 bg-white border-l border-gray-200 flex items-center justify-center">
        <div className="text-center text-gray-400 p-6">
          <User size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Seleccioná una conversación</p>
        </div>
      </div>
    )
  }

  const variables = contacto.variables ?? {}
  const tieneVariables = Object.keys(variables).length > 0

  return (
    <div className="w-72 flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto">
      {/* Header del contacto */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-lg flex-shrink-0">
            {contacto.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{contacto.nombre}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <InsigniaCanal canal={contacto.canal_origen as CanalOrigen} tamanio="sm" />
              <span className="text-xs text-gray-500 capitalize">{contacto.canal_origen}</span>
            </div>
          </div>
        </div>

        {/* Info básica */}
        <div className="space-y-2">
          {contacto.telefono && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone size={13} className="text-gray-400 flex-shrink-0" />
              <span>{contacto.telefono}</span>
            </div>
          )}
          {contacto.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail size={13} className="text-gray-400 flex-shrink-0" />
              <span className="truncate">{contacto.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock size={13} className="text-gray-400 flex-shrink-0" />
            <span>Ingresó {formatearFecha(contacto.creado_en)}</span>
          </div>
        </div>
      </div>

      {/* Etapa del embudo */}
      <div className="p-4 border-b border-gray-100">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Etapa del embudo</p>
        <select
          value={contacto.etapa}
          onChange={e => onCambiarEtapa(e.target.value)}
          className={cn(
            'w-full text-sm px-3 py-1.5 rounded-lg border-0 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-400',
            ETAPAS_COLORES[contacto.etapa] ?? 'bg-gray-100 text-gray-600'
          )}
        >
          {ETAPAS.map(etapa => (
            <option key={etapa} value={etapa}>{ETAPAS_LABELS[etapa]}</option>
          ))}
        </select>
      </div>

      {/* Etiquetas Smart */}
      {contacto.etiquetas_smart?.length > 0 && (
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Tag size={11} /> Etiquetas Smart
          </p>
          <div className="flex flex-wrap gap-1.5">
            {contacto.etiquetas_smart.map(etiq => (
              <span key={etiq} className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-full border border-violet-100">
                {etiq}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Variables dinámicas */}
      {tieneVariables && (
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={() => setVariablesExpandidas(!variablesExpandidas)}
            className="w-full flex items-center justify-between text-xs font-medium text-gray-500 uppercase tracking-wide mb-2"
          >
            <span className="flex items-center gap-1"><Building2 size={11} /> Variables detectadas</span>
            {variablesExpandidas ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {variablesExpandidas && (
            <div className="space-y-2">
              {Object.entries(variables).map(([clave, valor]) => (
                <div key={clave} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 capitalize">{clave.replace(/_/g, ' ')}</span>
                  <span className="font-medium text-gray-900 truncate max-w-[130px]">{String(valor)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Estado de la conversación */}
      <div className="p-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Estado IA</p>
        <div className={cn(
          'text-xs px-3 py-2 rounded-lg font-medium',
          estadoConversacion === 'BOT' ? 'bg-violet-50 text-violet-700' :
          estadoConversacion === 'HUMANO' ? 'bg-emerald-50 text-emerald-700' :
          'bg-gray-50 text-gray-600'
        )}>
          {estadoConversacion === 'BOT' ? '🤖 IA respondiendo automáticamente' :
           estadoConversacion === 'HUMANO' ? '👤 Agente humano en control' :
           estadoConversacion}
        </div>
      </div>
    </div>
  )
}
