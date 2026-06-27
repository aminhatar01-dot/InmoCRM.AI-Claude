'use client'

import { useState } from 'react'
import { Plus, Search, Download, Filter, User, Phone, Mail, MoreVertical } from 'lucide-react'
import { usarTenant } from '@/hooks/usarTenant'
import { usarContactos } from '@/hooks/usarContactos'
import { ModalContacto } from '@/components/contactos/ModalContacto'
import { cn, tiempoRelativo } from '@/lib/utilidades'
import type { Contacto } from '@/types'

const ETAPAS_LABELS: Record<string, string> = {
  nuevo: 'Nuevo', interesado: 'Interesado', visita_agendada: 'Visita',
  propuesta_enviada: 'Propuesta', cerrado: 'Cerrado', perdido: 'Perdido',
}
const ETAPAS_COLORES: Record<string, string> = {
  nuevo: 'bg-gray-100 text-gray-600', interesado: 'bg-blue-100 text-blue-700',
  visita_agendada: 'bg-amber-100 text-amber-700', propuesta_enviada: 'bg-violet-100 text-violet-700',
  cerrado: 'bg-emerald-100 text-emerald-700', perdido: 'bg-red-100 text-red-600',
}
const EMOJIS_CANAL: Record<string, string> = {
  whatsapp: 'WA', instagram: 'IG', facebook: 'FB', web: 'Web', manual: 'Manual',
}

export default function PaginaContactos() {
  const { tenant } = usarTenant()
  const [busqueda, setBusqueda] = useState('')
  const [etapaFiltro, setEtapaFiltro] = useState('')
  const [pagina, setPagina] = useState(0)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [contactoEditando, setContactoEditando] = useState<Contacto | null>(null)
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null)

  const { contactos, total, cargando, paginas, crearContacto, actualizarContacto, eliminarContacto } =
    usarContactos(tenant?.id ?? null, {
      busqueda: busqueda || undefined,
      etapa: etapaFiltro || undefined,
      pagina,
    })

  async function manejarGuardar(datos: Partial<Contacto>) {
    if (contactoEditando) return actualizarContacto(contactoEditando.id, datos)
    return crearContacto(datos)
  }

  function abrirEdicion(contacto: Contacto) {
    setContactoEditando(contacto); setModalAbierto(true); setMenuAbierto(null)
  }

  async function confirmarEliminar(id: string) {
    if (!window.confirm('Eliminar este contacto? Esta accion no se puede deshacer.')) return
    await eliminarContacto(id); setMenuAbierto(null)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Contactos</h1>
          <p className="text-sm text-gray-500">{total} contactos en total</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <Download size={14} /> Exportar
          </button>
          <button
            onClick={() => { setContactoEditando(null); setModalAbierto(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium"
          >
            <Plus size={16} /> Nuevo contacto
          </button>
        </div>
      </div>

      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setPagina(0) }}
            placeholder="Buscar por nombre, telefono o email..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select value={etapaFiltro} onChange={e => { setEtapaFiltro(e.target.value); setPagina(0) }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400">
            <option value="">Todas las etapas</option>
            {Object.entries(ETAPAS_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {cargando ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : contactos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <User size={24} className="text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-700 mb-1">Sin contactos</h3>
            <p className="text-sm text-gray-500 mb-4">
              {busqueda || etapaFiltro ? 'No hay resultados' : 'Agrega el primer contacto o conecta un canal'}
            </p>
            {!busqueda && !etapaFiltro && (
              <button onClick={() => { setContactoEditando(null); setModalAbierto(true) }}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">
                <Plus size={15} /> Nuevo contacto
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
              <tr>
                {['Contacto', 'Canal', 'Etapa', 'Etiquetas', 'Ultima actividad', ''].map(th => (
                  <th key={th} className="text-left text-xs font-medium text-gray-500 px-6 py-3 uppercase tracking-wide">{th}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {contactos.map(contacto => (
                <tr key={contacto.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-semibold flex-shrink-0">
                        {contacto.nombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{contacto.nombre}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                          {contacto.telefono && <span className="flex items-center gap-1"><Phone size={10} />{contacto.telefono}</span>}
                          {contacto.email && <span className="flex items-center gap-1"><Mail size={10} />{contacto.email}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {EMOJIS_CANAL[contacto.canal_origen] ?? contacto.canal_origen}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium',
                      ETAPAS_COLORES[contacto.etapa] ?? 'bg-gray-100 text-gray-600')}>
                      {ETAPAS_LABELS[contacto.etapa] ?? contacto.etapa}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {contacto.etiquetas_smart?.slice(0, 2).map((etiq: string) => (
                        <span key={etiq} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{etiq}</span>
                      ))}
                      {(contacto.etiquetas_smart?.length ?? 0) > 2 && (
                        <span className="text-xs text-gray-400">+{(contacto.etiquetas_smart?.length ?? 0) - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {tiempoRelativo(contacto.actualizado_en ?? contacto.creado_en)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative">
                      <button onClick={() => setMenuAbierto(menuAbierto === contacto.id ? null : contacto.id)}
                        className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
                        <MoreVertical size={15} />
                      </button>
                      {menuAbierto === contacto.id && (
                        <div className="absolute right-0 top-9 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 w-36">
                          <button onClick={() => abrirEdicion(contacto)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Editar</button>
                          <button onClick={() => confirmarEliminar(contacto.id)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Eliminar</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {paginas > 1 && (
        <div className="bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <p className="text-sm text-gray-500">Pagina {pagina + 1} de {paginas} · {total} contactos</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPagina(p => Math.max(0, p - 1))} disabled={pagina === 0}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Anterior</button>
            <button onClick={() => setPagina(p => Math.min(paginas - 1, p + 1))} disabled={pagina >= paginas - 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Siguiente</button>
          </div>
        </div>
      )}

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