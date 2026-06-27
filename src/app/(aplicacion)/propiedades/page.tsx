'use client'

import { useState } from 'react'
import { Plus, Search, RefreshCw, Grid, List } from 'lucide-react'
import { usarTenant } from '@/hooks/usarTenant'
import { usarPropiedades } from '@/hooks/usarPropiedades'
import { TarjetaPropiedad } from '@/components/propiedades/TarjetaPropiedad'
import { ModalPropiedad } from '@/components/propiedades/ModalPropiedad'
import type { Propiedad } from '@/types'

const TIPOS = ['departamento', 'casa', 'ph', 'local', 'oficina', 'terreno', 'cochera', 'galpon']
const OPERACIONES = [
  { id: 'venta', label: 'Venta' },
  { id: 'alquiler', label: 'Alquiler' },
  { id: 'alquiler_temporario', label: 'Alq. temp.' },
]

export default function PaginaPropiedades() {
  const { tenant } = usarTenant()
  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [operacionFiltro, setOperacionFiltro] = useState('')
  const [pagina, setPagina] = useState(0)
  const [vista, setVista] = useState<'grid' | 'lista'>('grid')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [propiedadEditando, setPropiedadEditando] = useState<Propiedad | null>(null)
  const [sincronizando, setSincronizando] = useState(false)

  const { propiedades, total, cargando, paginas, crearPropiedad, actualizarPropiedad, eliminarPropiedad, recargar } =
    usarPropiedades(tenant?.id ?? null, {
      busqueda: busqueda || undefined,
      tipo: tipoFiltro || undefined,
      operacion: operacionFiltro || undefined,
      pagina,
    })

  async function manejarGuardar(datos: Partial<Propiedad>) {
    if (propiedadEditando) return actualizarPropiedad(propiedadEditando.id, datos)
    return crearPropiedad(datos)
  }

  async function sincronizarTokko() {
    if (!tenant?.id) return
    setSincronizando(true)
    try {
      await fetch('/api/tokko/sincronizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenant.id }),
      })
      await recargar()
    } finally {
      setSincronizando(false)
    }
  }

  async function confirmarEliminar(id: string) {
    if (!window.confirm('Eliminar esta propiedad del catalogo?')) return
    await eliminarPropiedad(id)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Propiedades</h1>
          <p className="text-sm text-gray-500">{total} propiedades en el catalogo</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={sincronizarTokko}
            disabled={sincronizando}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={sincronizando ? 'animate-spin' : ''} /> Sync Tokko
          </button>
          <button
            onClick={() => { setPropiedadEditando(null); setModalAbierto(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium"
          >
            <Plus size={16} /> Nueva propiedad
          </button>
        </div>
      </div>

      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setPagina(0) }}
            placeholder="Buscar por titulo, zona o direccion..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>
        <select value={tipoFiltro} onChange={e => { setTipoFiltro(e.target.value); setPagina(0) }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2">
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <select value={operacionFiltro} onChange={e => { setOperacionFiltro(e.target.value); setPagina(0) }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2">
          <option value="">Todas las operaciones</option>
          {OPERACIONES.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden ml-auto">
          <button onClick={() => setVista('grid')}
            className={vista === 'grid' ? 'px-2.5 py-2 bg-violet-600 text-white' : 'px-2.5 py-2 text-gray-500 hover:bg-gray-50'}>
            <Grid size={15} />
          </button>
          <button onClick={() => setVista('lista')}
            className={vista === 'lista' ? 'px-2.5 py-2 bg-violet-600 text-white' : 'px-2.5 py-2 text-gray-500 hover:bg-gray-50'}>
            <List size={15} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {cargando ? (
          <div className={vista === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-3'}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 animate-pulse">
                <div className="h-40 bg-gray-200 rounded-t-xl" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : propiedades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-5xl mb-4">🏠</div>
            <h3 className="font-medium text-gray-700 mb-1">Sin propiedades</h3>
            <p className="text-sm text-gray-500 mb-4">
              {busqueda || tipoFiltro || operacionFiltro
                ? 'No hay resultados para los filtros aplicados'
                : 'Agrega propiedades manualmente o sincroniza con Tokko Broker'}
            </p>
            {!busqueda && !tipoFiltro && !operacionFiltro && (
              <button
                onClick={() => { setPropiedadEditando(null); setModalAbierto(true) }}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
              >
                <Plus size={15} /> Nueva propiedad
              </button>
            )}
          </div>
        ) : (
          <div className={vista === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-3'}>
            {propiedades.map(propiedad => (
              <TarjetaPropiedad
                key={propiedad.id}
                propiedad={propiedad}
                onEditar={p => { setPropiedadEditando(p); setModalAbierto(true) }}
                onEliminar={confirmarEliminar}
              />
            ))}
          </div>
        )}
      </div>

      {paginas > 1 && (
        <div className="bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <p className="text-sm text-gray-500">Pagina {pagina + 1} de {paginas} - {total} propiedades</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPagina(p => Math.max(0, p - 1))} disabled={pagina === 0}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">
              Anterior
            </button>
            <button onClick={() => setPagina(p => Math.min(paginas - 1, p + 1))} disabled={pagina >= paginas - 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">
              Siguiente
            </button>
          </div>
        </div>
      )}

      {modalAbierto && (
        <ModalPropiedad
          propiedad={propiedadEditando}
          onGuardar={manejarGuardar}
          onCerrar={() => { setModalAbierto(false); setPropiedadEditando(null) }}
        />
      )}
    </div>
  )
}
