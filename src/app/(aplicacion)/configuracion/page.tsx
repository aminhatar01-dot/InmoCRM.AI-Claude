'use client'

import { useState } from 'react'
import { Settings, CreditCard, Zap, Shield, ChevronRight, ExternalLink, Check } from 'lucide-react'
import { usarTenant } from '@/hooks/usarTenant'
import { cn } from '@/lib/utilidades'

const TABS = [
  { id: 'general', label: 'General', icono: Settings },
  { id: 'billing', label: 'Suscripcion y tokens', icono: CreditCard },
  { id: 'seguridad', label: 'Seguridad', icono: Shield },
]

const PLANES = [
  {
    id: 'basico',
    nombre: 'Basico',
    precio: 29,
    tokens: 50000,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASICO ?? '',
    features: ['1 canal de mensajes', '50k tokens/mes', 'Soporte por email', 'Hasta 500 contactos'],
  },
  {
    id: 'pro',
    nombre: 'Pro',
    precio: 79,
    tokens: 200000,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? '',
    destacado: true,
    features: ['Canales ilimitados', '200k tokens/mes', 'Soporte prioritario', 'Contactos ilimitados', 'Campanas broadcast', 'Sync Tokko Broker'],
  },
  {
    id: 'enterprise',
    nombre: 'Enterprise',
    precio: 199,
    tokens: 1000000,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE ?? '',
    features: ['Todo lo de Pro', '1M tokens/mes', 'SLA 99.9%', 'Soporte 24/7', 'Onboarding dedicado', 'API personalizada'],
  },
]

const PAQUETES_TOKENS = [
  { tokens: 50000, precio: 9.99, label: '50k tokens', montocentavos: 999 },
  { tokens: 150000, precio: 24.99, label: '150k tokens', montocentavos: 2499, destacado: true },
  { tokens: 500000, precio: 69.99, label: '500k tokens', montocentavos: 6999 },
]

export default function PaginaConfiguracion() {
  const { tenant } = usarTenant()
  const [tabActual, setTabActual] = useState('billing')
  const [cargandoPago, setCargandoPago] = useState<string | null>(null)

  async function irACheckout(tipo: 'suscripcion' | 'tokens', priceId?: string, tokens?: number, montoCentavos?: number) {
    setCargandoPago(priceId ?? `tokens-${tokens}`)
    const resp = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, price_id: priceId, tokens, monto_centavos: montoCentavos }),
    })
    const { url, error } = await resp.json()
    setCargandoPago(null)
    if (url) window.location.href = url
    else alert(error ?? 'Error al procesar el pago')
  }

  async function abrirPortal() {
    setCargandoPago('portal')
    const resp = await fetch('/api/stripe/portal', { method: 'POST' })
    const { url, error } = await resp.json()
    setCargandoPago(null)
    if (url) window.location.href = url
    else alert(error ?? 'Error al abrir el portal')
  }

  const planActual = tenant?.plan ?? 'basico'
  const saldo = tenant?.saldo_tokens_ia ?? 0

  return (
    <div className="flex h-full">
      {/* Sidebar de tabs */}
      <div className="w-56 bg-white border-r border-gray-200 flex-shrink-0 py-4">
        <div className="px-4 mb-4">
          <h1 className="text-base font-semibold text-gray-900">Configuracion</h1>
        </div>
        <nav className="space-y-0.5 px-2">
          {TABS.map(tab => {
            const Icono = tab.icono
            return (
              <button
                key={tab.id}
                onClick={() => setTabActual(tab.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                  tabActual === tab.id
                    ? 'bg-violet-50 text-violet-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <Icono size={15} />
                {tab.label}
                {tabActual === tab.id && <ChevronRight size={12} className="ml-auto" />}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Contenido del tab */}
      <div className="flex-1 overflow-auto">
        {tabActual === 'billing' && (
          <div className="p-8 max-w-4xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Suscripcion y tokens</h2>
            <p className="text-sm text-gray-500 mb-8">Gestion tu plan, recarga tokens y accede al historial de pagos.</p>

            {/* Saldo de tokens */}
            <div className="bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-violet-200 text-sm mb-1">Saldo de tokens IA</p>
                  <p className="text-3xl font-bold">{saldo.toLocaleString()}</p>
                  <p className="text-violet-200 text-xs mt-1">tokens disponibles</p>
                </div>
                <div className="text-right">
                  <Zap size={32} className="text-violet-300 ml-auto mb-2" />
                  <p className="text-sm font-medium capitalize bg-white/20 px-3 py-1 rounded-full">
                    Plan {planActual}
                  </p>
                </div>
              </div>
              {saldo < 10000 && (
                <div className="mt-4 bg-white/10 rounded-lg px-3 py-2 text-sm">
                  Saldo bajo. Recarga tokens para continuar usando el agente IA.
                </div>
              )}
            </div>

            {/* Planes */}
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Plan de suscripcion</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {PLANES.map(plan => {
                const esActual = plan.id === planActual
                return (
                  <div key={plan.id} className={cn(
                    'bg-white rounded-xl border p-5 relative',
                    plan.destacado ? 'border-violet-300 shadow-md' : 'border-gray-200',
                    esActual ? 'ring-2 ring-violet-600' : ''
                  )}>
                    {plan.destacado && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                        Mas popular
                      </span>
                    )}
                    {esActual && (
                      <span className="absolute -top-3 right-4 bg-emerald-600 text-white text-xs px-2 py-1 rounded-full">
                        Tu plan
                      </span>
                    )}
                    <h4 className="font-semibold text-gray-900 mb-1">{plan.nombre}</h4>
                    <div className="mb-3">
                      <span className="text-2xl font-bold text-gray-900">${plan.precio}</span>
                      <span className="text-gray-400 text-sm">/mes</span>
                    </div>
                    <p className="text-xs text-violet-600 font-medium mb-3">{plan.tokens.toLocaleString()} tokens/mes</p>
                    <ul className="space-y-1.5 mb-5">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                          <Check size={11} className="text-emerald-500 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {esActual ? (
                      <button
                        onClick={abrirPortal}
                        disabled={cargandoPago === 'portal'}
                        className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                      >
                        {cargandoPago === 'portal' ? 'Cargando...' : 'Administrar plan'}
                      </button>
                    ) : (
                      <button
                        onClick={() => irACheckout('suscripcion', plan.priceId)}
                        disabled={!!cargandoPago}
                        className={cn(
                          'w-full px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50',
                          plan.destacado
                            ? 'bg-violet-600 hover:bg-violet-700 text-white'
                            : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        {cargandoPago === plan.priceId ? 'Cargando...' : `Cambiar a ${plan.nombre}`}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Recargas de tokens */}
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Recargar tokens</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {PAQUETES_TOKENS.map(paq => (
                <div key={paq.tokens} className={cn(
                  'bg-white border rounded-xl p-4 relative',
                  paq.destacado ? 'border-violet-300' : 'border-gray-200'
                )}>
                  {paq.destacado && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs px-2 py-0.5 rounded-full">
                      Recomendado
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={16} className="text-violet-600" />
                    <span className="font-semibold text-gray-900">{paq.label}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 mb-3">${paq.precio}</p>
                  <button
                    onClick={() => irACheckout('tokens', undefined, paq.tokens, paq.montocentavos)}
                    disabled={!!cargandoPago}
                    className="w-full px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {cargandoPago === `tokens-${paq.tokens}` ? 'Cargando...' : 'Recargar'}
                  </button>
                </div>
              ))}
            </div>

            {/* Historial enlace */}
            <button
              onClick={abrirPortal}
              disabled={cargandoPago === 'portal'}
              className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 disabled:opacity-50"
            >
              <ExternalLink size={14} />
              Ver historial de pagos y facturas en Stripe
            </button>
          </div>
        )}

        {tabActual === 'general' && (
          <div className="p-8 max-w-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Configuracion general</h2>
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nombre de la agencia</label>
                <input
                  type="text"
                  defaultValue={tenant?.nombre ?? ''}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nombre del agente IA</label>
                <input
                  type="text"
                  defaultValue={(tenant?.configuracion as Record<string, string>)?.nombre_agente ?? 'Sofia'}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <button className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">
                Guardar cambios
              </button>
            </div>
          </div>
        )}

        {tabActual === 'seguridad' && (
          <div className="p-8 max-w-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Seguridad</h2>
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg">
                <Shield size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">Cuenta protegida</p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Tu cuenta usa autenticacion JWT con Supabase Auth. Las credenciales de integraciones estan cifradas con AES-256-GCM.
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Cambiar contrasena</label>
                <input type="password" placeholder="Nueva contrasena" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 mb-2" />
                <input type="password" placeholder="Confirmar contrasena" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>
              <button className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">
                Actualizar contrasena
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
