'use client'

import { CheckCircle, XCircle, Settings, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utilidades'

export interface ConfigIntegracion {
  id: string
  nombre: string
  descripcion: string
  icono: string
  tipo: string
  categoria: 'canal' | 'propiedad' | 'pagos' | 'crm'
  documentacion?: string
}

interface TarjetaIntegracionProps {
  config: ConfigIntegracion
  conectada: boolean
  onConectar: (tipo: string) => void
  onDesconectar: (tipo: string) => void
  onConfigurar?: (tipo: string) => void
}

const COLORES_CATEGORIA: Record<string, string> = {
  canal: 'bg-emerald-50 text-emerald-700',
  propiedad: 'bg-blue-50 text-blue-700',
  pagos: 'bg-amber-50 text-amber-700',
  crm: 'bg-violet-50 text-violet-700',
}

const LABELS_CATEGORIA: Record<string, string> = {
  canal: 'Canal de mensajes',
  propiedad: 'Propiedades',
  pagos: 'Pagos',
  crm: 'CRM externo',
}

export function TarjetaIntegracion({ config, conectada, onConectar, onDesconectar, onConfigurar }: TarjetaIntegracionProps) {
  return (
    <div className={cn(
      'bg-white rounded-xl border p-5 transition-all hover:shadow-md',
      conectada ? 'border-emerald-200' : 'border-gray-100'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
            {config.icono}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{config.nombre}</h3>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium',
              COLORES_CATEGORIA[config.categoria]
            )}>
              {LABELS_CATEGORIA[config.categoria]}
            </span>
          </div>
        </div>

        {/* Estado */}
        <div className="flex items-center gap-1">
          {conectada ? (
            <CheckCircle size={16} className="text-emerald-500" />
          ) : (
            <XCircle size={16} className="text-gray-300" />
          )}
          <span className={cn('text-xs font-medium', conectada ? 'text-emerald-600' : 'text-gray-400')}>
            {conectada ? 'Conectado' : 'No conectado'}
          </span>
        </div>
      </div>

      {/* Descripción */}
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">{config.descripcion}</p>

      {/* Acciones */}
      <div className="flex items-center gap-2">
        {conectada ? (
          <>
            {onConfigurar && (
              <button
                onClick={() => onConfigurar(config.tipo)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-50"
              >
                <Settings size={12} /> Configurar
              </button>
            )}
            <button
              onClick={() => onDesconectar(config.tipo)}
              className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs hover:bg-red-50"
            >
              Desconectar
            </button>
          </>
        ) : (
          <button
            onClick={() => onConectar(config.tipo)}
            className="flex-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-medium"
          >
            Conectar
          </button>
        )}

        {config.documentacion && (
          <a
            href={config.documentacion}
            target="_blank"
            rel="noopener noreferrer"
            className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          >
            <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  )
}
