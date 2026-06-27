'use client'

import { useState, useRef } from 'react'
import { Plus, MoreVertical } from 'lucide-react'
import { usarTenant } from '@/hooks/usarTenant'
import { usarContactos } from '@/hooks/usarContactos'
import { TarjetaLead } from '@/components/embudo/TarjetaLead'
import { ModalContacto } from '@/components/contactos/ModalContacto'
import { cn } from '@/lib/utilidades'
import type { Contacto } from '@/types'

const ETAPAS = [
  { id: 'nuevo', label: 'Nuevos', color: 'border-gray-300', colorBg: 'bg-gray-50', colorDot: 'bg-gray-400' },
  { id: 'interesado', label: 'Interesados', color: 'border-blue-300', colorBg: 'bg-blue-50', colorDot: 'bg-blue-400' },
  { id: 'visita_agendada', label: 'Visita agendada', color: 'border-amber-300', colorBg: 'bg-amber-50', colorDot: 'bg-amber-400' },
  { id: 'propuesta_enviada', label: 'Propuesta enviada', color: 'border-violet-300', colorBg: 'bg-violet-50', colorDot: 'bg-violet-400' },
  { id: 'cerrado', label: 'Cerrados', color: 'border-emerald-300', colorBg: 'bg-emerald-50', colorDot: 'bg-emerald-400' },
  { id: 'perdido', label: 'Perdidos', color: 'border-red-300', colorBg: 'bg-red-50', colorDot: 'bg-red-400' },
]

const ETAPA_IDS = ETAPAS.map(e => e.id)

export default function PaginaEmbudo() {
  const { tenant } = usarTenant()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [contactoEditando, setContactoEditando] = useState<Contacto | null>(null)
  const [etapaInicial, setEtapaInicial] = useState('nuevo')
  const [arrastrandoId, setArrastrandoId] = useState<string | null>(null)
  const [sobreEtapa, setSobreEtapa] = useState<string | null>(null)

  const { contactos, cargando, crearContacto, actualizarContacto } =
    usarContactos(tenant?.id ?? null, {})

  function contactosPorEtapa(etapaId: string) {
    return contactos.filter(c => c.etapa === etapaId)
  }

  async function moverContacto(id: string, etapa: string) {
    await actualizarContacto(id, { etapa } as Partial<Contacto>)
  }

  async function manejarGuardar(datos: Partial<Contacto>) {
    const datosConEtapa = { ...datos, etapa: contactoEditando?.etapa ?? etapaInicial }
    if (contactoEditando) return actualizarContacto(contactoEditando.id, datos)
    return crearContacto(datosConEtapa)
  }

  // Drag & Drop handlers
  function alArrastrar(e: React.DragEvent, id: string) {
    setArrastrandoId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function alSoltarEnColumna(e: React.DragEvent, etapaId: string) {
    e.preventDefault()
    if (arrastrandoId) moverContacto(arrastrandoId, etapaId)
    setArrastrandoId(null)
    setSobreEtapa(null)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Embudo de ventas</h1>
          <p className="text-sm text-gray-500">{contactos.length} contactos en el pipeline</p>
        </div>
        <button
          onClick={() => { setContactoEditando(null); setEtapaInicial('nuevo'); setModalAbierto(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium"
        >
          <Plus size={16} /> Nuevo lead
        </button>
      </div>

      {/* Tablero Kanban */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full gap-4 p-6 min-w-max">
          {ETAPAS.map(etapa => {
            const leads = contactosPorEtapa(etapa.id)
            const esSobre = sobreEtapa === etapa.id

            return (
              <div
                key={etapa.id}
                className={cn(
                  'flex flex-col w-64 rounded-xl border-2 transition-colors',
                  etapa.colorBg,
                  etapa.color,
                  esSobre ? 'border-violet-400 bg-violet-50' : ''
                )}
                onDragOver={e => { e.preventDefault(); setSobreEtapa(etapa.id) }}
                onDragLeave={() => setSobreEtapa(null)}
                onDrop={e => alSoltarEnColumna(e, etapa.id)}
              >
                {/* Cabecera columna */}
                <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2.5 h-2.5 rounded-full', etapa.colorDot)} />
                    <span className="text-sm font-semibold text-gray-700">{etapa.label}</span>
                    <span className="text-xs bg-white/80 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
                      {leads.length}
                    </span>
                  </div>
                  <button
                    onClick={() => { setContactoEditando(null); setEtapaInicial(etapa.id); setModalAbierto(true) }}
                    className="w-6 h-6 rounded hover:bg-white/60 flex items-center justify-center text-gray-400 hover:text-gray-600"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Tarjetas */}
                <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2.5">
                  {cargando ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-xl h-24 animate-pulse border border-gray-100" />
                    ))
                  ) : leads.length === 0 ? (
                    <div className="flex items-center justify-center h-20 text-xs text-gray-400">
                      Sin leads aqui
                    </div>
                  ) : (
                    leads.map(contacto => (
                      <div
                        key={contacto.id}
                        draggable
                        onDragStart={e => alArrastrar(e, contacto.id)}
                        onDragEnd={() => { setArrastrandoId(null); setSobreEtapa(null) }}
                        className={cn('cursor-grab active:cursor-grabbing', arrastrandoId === contacto.id ? 'opacity-50' : '')}
                      >
                        <TarjetaLead
                          contacto={contacto}
                          onAbrir={c => { setContactoEditando(c); setModalAbierto(true) }}
                          onMover={moverContacto}
                          etapas={ETAPA_IDS}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {modalAbierto && (
        <ModalContacto
          contacto={contactoEditando}
          onGuardar={manejarGuardar}
          onCerrar={() => { setModalAbierto(false); setContactoEditando(null) }}
        />
      )}
    </div>
  )
}