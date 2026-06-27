'use client'

import { useState } from 'react'
import { X, Send, Users, Tag, Zap } from 'lucide-react'
import type { Campana } from '@/types'

interface ModalCampanaProps {
  onGuardar: (datos: Partial<Campana>) => Promise<Campana | null>
  onCerrar: () => void
}

const ETAPAS_OPCIONES = [
  { id: 'nuevo', label: 'Nuevos' },
  { id: 'interesado', label: 'Interesados' },
  { id: 'visita_agendada', label: 'Visita agendada' },
  { id: 'propuesta_enviada', label: 'Propuesta enviada' },
  { id: 'perdido', label: 'Perdidos (reactivación)' },
]

const VARIABLES_DISPONIBLES = ['{nombre}', '{zona}', '{presupuesto}', '{tipo_propiedad}']

export function ModalCampana({ onGuardar, onCerrar }: ModalCampanaProps) {
  const [nombre, setNombre] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [etapasSeleccionadas, setEtapasSeleccionadas] = useState<string[]>([])
  const [programadaEn, setProgramadaEn] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  function toggleEtapa(etapaId: string) {
    setEtapasSeleccionadas(prev =>
      prev.includes(etapaId) ? prev.filter(e => e !== etapaId) : [...prev, etapaId]
    )
  }

  function insertarVariable(variable: string) {
    setMensaje(prev => prev + variable)
  }

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (!mensaje.trim()) { setError('El mensaje es obligatorio'); return }
    setGuardando(true)
    setError('')
    const datos: Partial<Campana> = {
      nombre,
      mensaje,
      segmento: etapasSeleccionadas.length > 0 ? { etapas: etapasSeleccionadas } : undefined,
      programada_en: programadaEn || undefined,
    }
    const ok = await onGuardar(datos)
    setGuardando(false)
    if (ok) onCerrar()
    else setError('No se pudo guardar la campaña')
  }

  const caracteresRestantes = 1024 - mensaje.length

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
              <Send size={16} className="text-violet-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Nueva campaña</h2>
          </div>
          <button onClick={onCerrar} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={manejarEnvio} className="p-6 space-y-5">
          {/* Nombre */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Nombre de la campaña <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Seguimiento leads calientes mayo"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          {/* Segmento */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              <Users size={13} className="inline mr-1" />Segmento de contactos
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Si no seleccionas ninguna etapa, se enviará a todos los contactos con teléfono.
            </p>
            <div className="flex flex-wrap gap-2">
              {ETAPAS_OPCIONES.map(etapa => (
                <button
                  key={etapa.id}
                  type="button"
                  onClick={() => toggleEtapa(etapa.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    etapasSeleccionadas.includes(etapa.id)
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {etapa.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mensaje */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">
                Mensaje <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs ${caracteresRestantes < 100 ? 'text-red-500' : 'text-gray-400'}`}>
                {caracteresRestantes} restantes
              </span>
            </div>
            <textarea
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              rows={5}
              maxLength={1024}
              placeholder="Hola {nombre}! Te escribo desde la inmobiliaria..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
            />
            {/* Variables */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Zap size={10} /> Variables:
              </span>
              {VARIABLES_DISPONIBLES.map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertarVariable(v)}
                  className="text-xs bg-violet-50 hover:bg-violet-100 text-violet-700 px-2 py-1 rounded font-mono transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Programar */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Programar envío (opcional)
            </label>
            <input
              type="datetime-local"
              value={programadaEn}
              onChange={e => setProgramadaEn(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <p className="text-xs text-gray-400 mt-1">
              Si no programas fecha, podras lanzarla manualmente desde el dashboard.
            </p>
          </div>

          {/* Vista previa del mensaje */}
          {mensaje && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Vista previa</p>
              <div className="bg-emerald-600 text-white text-sm px-3.5 py-2.5 rounded-2xl rounded-tr-none max-w-xs ml-auto">
                {mensaje.replace('{nombre}', 'María').replace('{zona}', 'Palermo')}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onCerrar}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
              {guardando ? 'Guardando...' : 'Guardar campaña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
