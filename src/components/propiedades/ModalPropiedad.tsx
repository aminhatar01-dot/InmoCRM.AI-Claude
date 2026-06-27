'use client'

import { useState, useEffect } from 'react'
import { X, Home, DollarSign, MapPin } from 'lucide-react'
import type { Propiedad } from '@/types'

interface ModalPropiedadProps {
  propiedad?: Propiedad | null
  onGuardar: (datos: Partial<Propiedad>) => Promise<boolean | Propiedad | null>
  onCerrar: () => void
}

const TIPOS = ['departamento', 'casa', 'ph', 'local', 'oficina', 'terreno', 'cochera', 'galpon']
const OPERACIONES = ['venta', 'alquiler', 'alquiler_temporario']
const ESTADOS = ['disponible', 'reservada', 'vendida', 'alquilada']
const MONEDAS = ['USD', 'ARS', 'EUR']

export function ModalPropiedad({ propiedad, onGuardar, onCerrar }: ModalPropiedadProps) {
  const [form, setForm] = useState({
    titulo: '',
    tipo: 'departamento',
    operacion: 'venta',
    estado: 'disponible',
    precio: '',
    moneda: 'USD',
    zona: '',
    direccion: '',
    dormitorios: '',
    banios: '',
    superficie_total: '',
    descripcion: '',
    url_externa: '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (propiedad) {
      setForm({
        titulo: propiedad.titulo ?? '',
        tipo: propiedad.tipo ?? 'departamento',
        operacion: propiedad.operacion ?? 'venta',
        estado: propiedad.estado ?? 'disponible',
        precio: String(propiedad.precio ?? ''),
        moneda: propiedad.moneda ?? 'USD',
        zona: propiedad.zona ?? '',
        direccion: propiedad.direccion ?? '',
        dormitorios: String(propiedad.dormitorios ?? ''),
        banios: String(propiedad.banios ?? ''),
        superficie_total: String(propiedad.superficie_total ?? ''),
        descripcion: propiedad.descripcion ?? '',
        url_externa: propiedad.url_externa ?? '',
      })
    }
  }, [propiedad])

  function campo(clave: string, valor: string) {
    setForm(prev => ({ ...prev, [clave]: valor }))
  }

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titulo.trim()) { setError('El título es obligatorio'); return }
    setGuardando(true)
    setError('')
    const datos: Partial<Propiedad> = {
      titulo: form.titulo,
      tipo: form.tipo as Propiedad['tipo'],
      operacion: form.operacion as Propiedad['operacion'],
      estado: form.estado as Propiedad['estado'],
      precio: form.precio ? Number(form.precio) : undefined,
      moneda: form.moneda,
      zona: form.zona,
      direccion: form.direccion,
      dormitorios: form.dormitorios ? Number(form.dormitorios) : undefined,
      banios: form.banios ? Number(form.banios) : undefined,
      superficie_total: form.superficie_total ? Number(form.superficie_total) : undefined,
      descripcion: form.descripcion,
      url_externa: form.url_externa,
    }
    const ok = await onGuardar(datos)
    setGuardando(false)
    if (ok) onCerrar()
    else setError('No se pudo guardar la propiedad')
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
              <Home size={16} className="text-violet-600" />
            </div>
            <h2 className="font-semibold text-gray-900">
              {propiedad ? 'Editar propiedad' : 'Nueva propiedad'}
            </h2>
          </div>
          <button onClick={onCerrar} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={manejarEnvio} className="p-6 space-y-4">
          {/* Título */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.titulo}
              onChange={e => campo('titulo', e.target.value)}
              placeholder="Ej: Departamento 2 amb. en Palermo"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          {/* Tipo, Operación, Estado */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => campo('tipo', e.target.value)}
                className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                {TIPOS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Operación</label>
              <select value={form.operacion} onChange={e => campo('operacion', e.target.value)}
                className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                {OPERACIONES.map(o => <option key={o} value={o}>{o === 'alquiler_temporario' ? 'Alq. temp.' : o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Estado</label>
              <select value={form.estado} onChange={e => campo('estado', e.target.value)}
                className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                {ESTADOS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Precio */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1">Precio</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={form.precio}
                  onChange={e => campo('precio', e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Moneda</label>
              <select value={form.moneda} onChange={e => campo('moneda', e.target.value)}
                className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                {MONEDAS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Ubicación */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Zona / Barrio</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={form.zona}
                  onChange={e => campo('zona', e.target.value)}
                  placeholder="Palermo, Belgrano..."
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Dirección</label>
              <input
                type="text"
                value={form.direccion}
                onChange={e => campo('direccion', e.target.value)}
                placeholder="Av. Santa Fe 1234"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
          </div>

          {/* Atributos */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { clave: 'dormitorios', label: 'Dormitorios' },
              { clave: 'banios', label: 'Baños' },
              { clave: 'superficie_total', label: 'Superficie m²' },
            ].map(({ clave, label }) => (
              <div key={clave}>
                <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
                <input
                  type="number"
                  value={form[clave as keyof typeof form]}
                  onChange={e => campo(clave, e.target.value)}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            ))}
          </div>

          {/* Descripción */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={e => campo('descripcion', e.target.value)}
              rows={3}
              placeholder="Descripción de la propiedad para el catálogo..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
            />
          </div>

          {/* URL externa */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">URL externa (opcional)</label>
            <input
              type="url"
              value={form.url_externa}
              onChange={e => campo('url_externa', e.target.value)}
              placeholder="https://tokkobroker.com/..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCerrar}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
              {guardando ? 'Guardando...' : propiedad ? 'Guardar cambios' : 'Crear propiedad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
