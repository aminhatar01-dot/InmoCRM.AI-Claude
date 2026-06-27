'use client'

import { useState, useEffect } from 'react'
import { X, User, Phone, Mail, MapPin, Tag } from 'lucide-react'
import { cn } from '@/lib/utilidades'
import type { Contacto } from '@/types'

interface ModalContactoProps {
  contacto?: Contacto | null
  onGuardar: (datos: Partial<Contacto>) => Promise<boolean | Contacto | null>
  onCerrar: () => void
}

const ETAPAS = [
  { id: 'nuevo', label: 'Nuevo' },
  { id: 'interesado', label: 'Interesado' },
  { id: 'visita_agendada', label: 'Visita agendada' },
  { id: 'propuesta_enviada', label: 'Propuesta enviada' },
  { id: 'cerrado', label: 'Cerrado' },
  { id: 'perdido', label: 'Perdido' },
]

const CANALES = ['whatsapp', 'instagram', 'facebook', 'web', 'manual']

export function ModalContacto({ contacto, onGuardar, onCerrar }: ModalContactoProps) {
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    etapa: 'nuevo',
    canal_origen: 'manual',
    notas: '',
    etiquetas_smart: [] as string[],
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [etiquetaInput, setEtiquetaInput] = useState('')

  useEffect(() => {
    if (contacto) {
      setForm({
        nombre: contacto.nombre ?? '',
        telefono: contacto.telefono ?? '',
        email: contacto.email ?? '',
        etapa: contacto.etapa ?? 'nuevo',
        canal_origen: contacto.canal_origen ?? 'manual',
        notas: contacto.notas ?? '',
        etiquetas_smart: contacto.etiquetas_smart ?? [],
      })
    }
  }, [contacto])

  function campo(clave: string, valor: string) {
    setForm(prev => ({ ...prev, [clave]: valor }))
  }

  function agregarEtiqueta() {
    const etiqueta = etiquetaInput.trim()
    if (!etiqueta || form.etiquetas_smart.includes(etiqueta)) return
    setForm(prev => ({ ...prev, etiquetas_smart: [...prev.etiquetas_smart, etiqueta] }))
    setEtiquetaInput('')
  }

  function quitarEtiqueta(etiqueta: string) {
    setForm(prev => ({ ...prev, etiquetas_smart: prev.etiquetas_smart.filter(e => e !== etiqueta) }))
  }

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setGuardando(true)
    setError('')
    const ok = await onGuardar({ ...form, canal_origen: form.canal_origen as import('@/types').CanalOrigen })
    setGuardando(false)
    if (ok) onCerrar()
    else setError('No se pudo guardar el contacto')
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
              <User size={16} className="text-violet-600" />
            </div>
            <h2 className="font-semibold text-gray-900">
              {contacto ? 'Editar contacto' : 'Nuevo contacto'}
            </h2>
          </div>
          <button onClick={onCerrar} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={manejarEnvio} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={form.nombre}
                onChange={e => campo('nombre', e.target.value)}
                placeholder="Nombre completo"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
          </div>

          {/* Teléfono y Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Teléfono</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={e => campo('telefono', e.target.value)}
                  placeholder="+54 11..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => campo('email', e.target.value)}
                  placeholder="correo@..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            </div>
          </div>

          {/* Canal y Etapa */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Canal de origen</label>
              <select
                value={form.canal_origen}
                onChange={e => campo('canal_origen', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                {CANALES.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Etapa</label>
              <select
                value={form.etapa}
                onChange={e => campo('etapa', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                {ETAPAS.map(e => (
                  <option key={e.id} value={e.id}>{e.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Notas</label>
            <textarea
              value={form.notas}
              onChange={e => campo('notas', e.target.value)}
              rows={3}
              placeholder="Observaciones, preferencias, presupuesto..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
            />
          </div>

          {/* Etiquetas */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              <Tag size={13} className="inline mr-1" />Etiquetas Smart
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={etiquetaInput}
                onChange={e => setEtiquetaInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarEtiqueta() } }}
                placeholder="Agregar etiqueta..."
                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              <button
                type="button"
                onClick={agregarEtiqueta}
                className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700"
              >
                +
              </button>
            </div>
            {form.etiquetas_smart.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.etiquetas_smart.map(etiq => (
                  <span
                    key={etiq}
                    className="flex items-center gap-1 text-xs bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full border border-violet-100"
                  >
                    {etiq}
                    <button type="button" onClick={() => quitarEtiqueta(etiq)} className="hover:text-violet-900">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          {/* Acciones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
            >
              {guardando ? 'Guardando...' : contacto ? 'Guardar cambios' : 'Crear contacto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
