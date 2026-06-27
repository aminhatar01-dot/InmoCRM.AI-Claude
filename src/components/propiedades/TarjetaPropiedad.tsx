'use client'

import { Bed, Bath, Square, MapPin, Edit2, Trash2, ExternalLink } from 'lucide-react'
import { cn, formatearPrecio } from '@/lib/utilidades'
import type { Propiedad } from '@/types'

interface TarjetaPropiedadProps {
  propiedad: Propiedad
  onEditar?: (p: Propiedad) => void
  onEliminar?: (id: string) => void
}

const COLORES_OPERACION: Record<string, string> = {
  venta: 'bg-blue-100 text-blue-700',
  alquiler: 'bg-emerald-100 text-emerald-700',
  alquiler_temporario: 'bg-amber-100 text-amber-700',
}

const COLORES_ESTADO: Record<string, string> = {
  disponible: 'bg-emerald-100 text-emerald-700',
  reservada: 'bg-amber-100 text-amber-700',
  vendida: 'bg-gray-100 text-gray-600',
  alquilada: 'bg-blue-100 text-blue-700',
}

export function TarjetaPropiedad({ propiedad, onEditar, onEliminar }: TarjetaPropiedadProps) {
  const fotos = (propiedad.fotos as string[]) ?? []
  const fotoPortada = fotos[0] ?? null

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
      {/* Imagen */}
      <div className="relative h-40 bg-gray-100">
        {fotoPortada ? (
          <img
            src={fotoPortada}
            alt={propiedad.titulo}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
            🏠
          </div>
        )}
        {/* Badges superpuestos */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', COLORES_OPERACION[propiedad.operacion])}>
            {propiedad.operacion === 'alquiler_temporario' ? 'Alq. temp.' : propiedad.operacion.charAt(0).toUpperCase() + propiedad.operacion.slice(1)}
          </span>
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', COLORES_ESTADO[propiedad.estado])}>
            {propiedad.estado.charAt(0).toUpperCase() + propiedad.estado.slice(1)}
          </span>
        </div>
        {/* Acciones en hover */}
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEditar && (
            <button
              onClick={() => onEditar(propiedad)}
              className="w-7 h-7 bg-white/90 hover:bg-white rounded-lg flex items-center justify-center text-gray-600 shadow-sm"
            >
              <Edit2 size={13} />
            </button>
          )}
          {onEliminar && (
            <button
              onClick={() => onEliminar(propiedad.id)}
              className="w-7 h-7 bg-white/90 hover:bg-red-50 hover:text-red-600 rounded-lg flex items-center justify-center text-gray-600 shadow-sm"
            >
              <Trash2 size={13} />
            </button>
          )}
          {propiedad.url_externa && (
            <a
              href={propiedad.url_externa}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 bg-white/90 hover:bg-white rounded-lg flex items-center justify-center text-gray-600 shadow-sm"
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">{propiedad.titulo}</h3>

        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <MapPin size={11} />
          <span className="truncate">{propiedad.zona}{propiedad.direccion ? ` · ${propiedad.direccion}` : ''}</span>
        </div>

        {/* Atributos */}
        <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
          {propiedad.dormitorios != null && (
            <span className="flex items-center gap-1">
              <Bed size={11} /> {propiedad.dormitorios} dorm.
            </span>
          )}
          {propiedad.banios != null && (
            <span className="flex items-center gap-1">
              <Bath size={11} /> {propiedad.banios} baños
            </span>
          )}
          {propiedad.superficie_total != null && (
            <span className="flex items-center gap-1">
              <Square size={11} /> {propiedad.superficie_total}m²
            </span>
          )}
        </div>

        {/* Precio */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-gray-900">
              {propiedad.precio != null ? formatearPrecio(propiedad.precio, propiedad.moneda) : 'Consultar'}
            </p>
            {propiedad.tipo && (
              <p className="text-xs text-gray-400 capitalize">{propiedad.tipo.replace('_', ' ')}</p>
            )}
          </div>
          {propiedad.fuente_externa && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
              {propiedad.fuente_externa}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
