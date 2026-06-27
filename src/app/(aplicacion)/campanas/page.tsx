'use client'

import { useState } from 'react'
import { Plus, Send, TrendingUp, Users, Zap } from 'lucide-react'
import { usarTenant } from '@/hooks/usarTenant'
import { usarCampanas } from '@/hooks/usarCampanas'
import { TarjetaCampana } from '@/components/campanas/TarjetaCampana'
import { ModalCampana } from '@/components/campanas/ModalCampana'
import type { Campana } from '@/types'

export default function PaginaCampanas() {
  const { tenant } = usarTenant()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [lanzandoId, setLanzandoId] = useState<string | null>(null)
  const [campanaDetalle, setCampanaDetalle] = useState<Campana | null>(null)
  const [resultado, setResultado] = useState<{ ok: boolean; enviados: number; error?: string } | null>(null)

  const { campanas, cargando, crearCampana, eliminarCampana, lanzarCampana } =
    usarCampanas(tenant?.id ?? null)

  const enviadas = campanas.filter(c => c.estado === 'ENVIADA')
  const totalEnviados = enviadas.reduce((s, c) => s + (c.total_enviados ?? 0), 0)
  const totalRespondidos = enviadas.reduce((s, c) => s + (c.total_respondidos ?? 0), 0)
  const tasaGlobal = totalEnviados > 0 ? Math.round((totalRespondidos / totalEnviados) * 100) : 0

  async function manejarLanzar(id: string) {
    setLanzandoId(id)
    setResultado(null)
    const res = await lanzarCampana(id)
    setLanzandoId(null)
    setResultado(res)
    setTimeout(() => setResultado(null), 6000)
  }

  async function manejarEliminar(id: string) {
    if (!window.confirm('Eliminar esta campana?')) return
    await eliminarCampana(id)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cabecera */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Campanas</h1>
          <p className="text-sm text-gray-500">{campanas.length} campanas creadas</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium"
        >
          <Plus size={16} /> Nueva campana
        </button>
      </div>

      {/* Stats globales */}
      {enviadas.length > 0 && (
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center">
                <Send size={16} className="text-violet-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{totalEnviados.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Mensajes enviados</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{tasaGlobal}%</p>
                <p className="text-xs text-gray-500">Tasa de respuesta</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                <Users size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{enviadas.length}</p>
                <p className="text-xs text-gray-500">Campanas completadas</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notificacion resultado */}
      {resultado && (
        <div className={`mx-6 mt-4 px-4 py-3 rounded-xl text-sm flex-shrink-0 ${
          resultado.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {resultado.ok
            ? `Campana lanzada correctamente. Se enviaron ${resultado.enviados} mensajes.`
            : resultado.error ?? 'Error al lanzar la campana'}
        </div>
      )}

      {/* Lista de campanas */}
      <div className="flex-1 overflow-auto p-6">
        {cargando ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse h-52">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : campanas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-4">
              <Zap size={28} className="text-violet-400" />
            </div>
            <h3 className="font-medium text-gray-700 mb-1">Sin campanas</h3>
            <p className="text-sm text-gray-500 mb-4">
              Crea tu primera campana de WhatsApp para llegar a tus leads de forma masiva
            </p>
            <button
              onClick={() => setModalAbierto(true)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
            >
              <Plus size={15} /> Nueva campana
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {campanas.map(campana => (
              <TarjetaCampana
                key={campana.id}
                campana={campana}
                onLanzar={manejarLanzar}
                onEliminar={manejarEliminar}
                onVer={setCampanaDetalle}
                lanzando={lanzandoId === campana.id}
              />
            ))}
          </div>
        )}
      </div>

      {modalAbierto && (
        <ModalCampana
          onGuardar={crearCampana}
          onCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  )
}
