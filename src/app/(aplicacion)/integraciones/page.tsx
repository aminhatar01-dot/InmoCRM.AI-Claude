'use client'

import { useState, useEffect } from 'react'
import { usarTenant } from '@/hooks/usarTenant'
import { TarjetaIntegracion, type ConfigIntegracion } from '@/components/integraciones/TarjetaIntegracion'
import { ModalConectarIntegracion } from '@/components/integraciones/ModalConectarIntegracion'

const INTEGRACIONES: ConfigIntegracion[] = [
  {
    id: 'whatsapp',
    nombre: 'WhatsApp Business',
    descripcion: 'Conecta WhatsApp Business API via Meta for Developers. Recibe y responde mensajes con IA automáticamente.',
    icono: '💬',
    tipo: 'whatsapp',
    categoria: 'canal',
  },
  {
    id: 'instagram',
    nombre: 'Instagram DM',
    descripcion: 'Responde mensajes directos de Instagram con tu agente IA. Captura leads desde stories y posts.',
    icono: '📸',
    tipo: 'instagram',
    categoria: 'canal',
  },
  {
    id: 'facebook',
    nombre: 'Facebook Messenger',
    descripcion: 'Gestiona conversaciones de tu página de Facebook desde la bandeja unificada.',
    icono: '👥',
    tipo: 'facebook',
    categoria: 'canal',
  },
  {
    id: 'mercadolibre',
    nombre: 'MercadoLibre',
    descripcion: 'Sincroniza propiedades y responde preguntas de MercadoLibre directamente desde InmoCRM.',
    icono: '🛒',
    tipo: 'mercadolibre',
    categoria: 'canal',
  },
  {
    id: 'tokko',
    nombre: 'Tokko Broker',
    descripcion: 'Importa tu catálogo de propiedades de Tokko Broker y mantenlo sincronizado automáticamente.',
    icono: '🏠',
    tipo: 'tokko',
    categoria: 'propiedad',
  },
  {
    id: 'google_calendar',
    nombre: 'Google Calendar',
    descripcion: 'Sincroniza visitas y reuniones con Google Calendar. Crea eventos automáticamente al agendar visitas.',
    icono: '📅',
    tipo: 'google_calendar',
    categoria: 'propiedad',
  },
  {
    id: 'stripe',
    nombre: 'Stripe',
    descripcion: 'Gestiona suscripciones y recargas de tokens con Stripe. Facturación automática.',
    icono: '💳',
    tipo: 'stripe',
    categoria: 'pagos',
  },
  {
    id: 'mercadopago',
    nombre: 'MercadoPago',
    descripcion: 'Acepta pagos en Argentina, México y Brasil con MercadoPago. Ideal para inmobiliarias LATAM.',
    icono: '💰',
    tipo: 'mercadopago',
    categoria: 'pagos',
  },
]

const CATEGORIAS = [
  { id: 'todas', label: 'Todas' },
  { id: 'canal', label: 'Canales' },
  { id: 'propiedad', label: 'Propiedades' },
  { id: 'pagos', label: 'Pagos' },
  { id: 'crm', label: 'CRM' },
]

interface IntegracionActiva {
  tipo: string
  activa: boolean
}

export default function PaginaIntegraciones() {
  const { tenant } = usarTenant()
  const [categoria, setCategoria] = useState('todas')
  const [modalTipo, setModalTipo] = useState<string | null>(null)
  const [integracionesActivas, setIntegracionesActivas] = useState<IntegracionActiva[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      const resp = await fetch('/api/integraciones')
      if (resp.ok) {
        const { integraciones } = await resp.json()
        setIntegracionesActivas(integraciones ?? [])
      }
      setCargando(false)
    }
    cargar()
  }, [])

  function estaConectada(tipo: string): boolean {
    return integracionesActivas.some(i => i.tipo === tipo && i.activa)
  }

  async function conectar(tipo: string, credenciales: Record<string, string>): Promise<boolean> {
    const resp = await fetch('/api/integraciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, credenciales }),
    })
    if (resp.ok) {
      setIntegracionesActivas(prev => {
        const sinEste = prev.filter(i => i.tipo !== tipo)
        return [...sinEste, { tipo, activa: true }]
      })
      setModalTipo(null)
    }
    return resp.ok
  }

  async function desconectar(tipo: string) {
    if (!window.confirm('Desconectar esta integración?')) return
    const resp = await fetch(`/api/integraciones?tipo=${tipo}`, { method: 'DELETE' })
    if (resp.ok) {
      setIntegracionesActivas(prev => prev.map(i => i.tipo === tipo ? { ...i, activa: false } : i))
    }
  }

  const integFiltradas = categoria === 'todas'
    ? INTEGRACIONES
    : INTEGRACIONES.filter(i => i.categoria === categoria)

  const conectadas = integracionesActivas.filter(i => i.activa).length
  const modalConfig = INTEGRACIONES.find(i => i.tipo === modalTipo)

  return (
    <div className="flex flex-col h-full">
      {/* Cabecera */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Integraciones</h1>
          <p className="text-sm text-gray-500">
            {cargando ? 'Cargando...' : `${conectadas} de ${INTEGRACIONES.length} conectadas`}
          </p>
        </div>
      </div>

      {/* Filtros de categoría */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-2 flex-shrink-0">
        {CATEGORIAS.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategoria(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              categoria === cat.id
                ? 'bg-violet-600 text-white font-medium'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid de integraciones */}
      <div className="flex-1 overflow-auto p-6">
        {cargando ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse h-44">
                <div className="flex gap-3 mb-3">
                  <div className="w-11 h-11 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {integFiltradas.map(integ => (
              <TarjetaIntegracion
                key={integ.id}
                config={integ}
                conectada={estaConectada(integ.tipo)}
                onConectar={tipo => setModalTipo(tipo)}
                onDesconectar={desconectar}
                onConfigurar={tipo => setModalTipo(tipo)}
              />
            ))}
          </div>
        )}

        {/* Banner webhook WhatsApp */}
        {estaConectada('whatsapp') && (
          <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-emerald-800 mb-1">Webhook de WhatsApp configurado</h3>
            <p className="text-xs text-emerald-700 mb-2">
              Configura esta URL en Meta for Developers como webhook callback URL:
            </p>
            <code className="text-xs bg-white border border-emerald-200 rounded px-3 py-2 block text-emerald-900 break-all">
              {`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://tu-dominio.vercel.app'}/api/webhook/whatsapp`}
            </code>
          </div>
        )}
      </div>

      {/* Modal conectar */}
      {modalTipo && modalConfig && (
        <ModalConectarIntegracion
          tipo={modalTipo}
          nombreIntegracion={modalConfig.nombre}
          onGuardar={conectar}
          onCerrar={() => setModalTipo(null)}
        />
      )}
    </div>
  )
}
