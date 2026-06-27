'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Users, MessageCircle, Zap, TrendingUp, Bot, Calendar } from 'lucide-react'
import { usarTenant } from '@/hooks/usarTenant'
import { cn } from '@/lib/utilidades'

const COLORES_EMBUDO = ['#94a3b8', '#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444']
const COLORES_CANAL = ['#25D366', '#E1306C', '#1877F2', '#4A90D9', '#FFE600', '#94a3b8']

const ETAPAS_LABELS: Record<string, string> = {
  nuevo: 'Nuevos', interesado: 'Interesados', visita_agendada: 'Visita',
  propuesta_enviada: 'Propuesta', cerrado: 'Cerrados', perdido: 'Perdidos',
}

interface KPIs {
  total_contactos: number
  conversaciones_activas: number
  campanas_enviadas: number
  tasa_respuesta_campanas: number
}

interface DatosDia { dia: string; total: number; bot?: number; humano?: number }
interface DatosTokens { dia: string; cantidad: number }
interface DatosEmbudo { etapa: string; total: number }
interface DatosCanal { canal: string; total: number }

interface DatosAnalitica {
  kpis: KPIs
  contactos_por_dia: DatosDia[]
  conversaciones_por_dia: DatosDia[]
  tokens_por_dia: DatosTokens[]
  embudo: DatosEmbudo[]
  canales: DatosCanal[]
}

function KpiCard({ titulo, valor, icono: Icono, subtexto, color }: {
  titulo: string; valor: string | number; icono: React.ElementType
  subtexto?: string; color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{titulo}</p>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', color)}>
          <Icono size={16} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{valor}</p>
      {subtexto && <p className="text-xs text-gray-400 mt-1">{subtexto}</p>}
    </div>
  )
}

const formatearDia = (dia: string) => {
  const d = new Date(dia + 'T00:00:00')
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

export default function PaginaAnaliticas() {
  const { tenant } = usarTenant()
  const [datos, setDatos] = useState<DatosAnalitica | null>(null)
  const [cargando, setCargando] = useState(true)
  const [rango, setRango] = useState(30)

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      const resp = await fetch(`/api/analiticas?dias=${rango}`)
      if (resp.ok) {
        const json = await resp.json()
        setDatos(json)
      }
      setCargando(false)
    }
    cargar()
  }, [rango])

  const saldo = tenant?.saldo_tokens_ia ?? 0

  return (
    <div className="flex flex-col h-full">
      {/* Cabecera */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Analiticas</h1>
          <p className="text-sm text-gray-500">Rendimiento de tu CRM en tiempo real</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setRango(d)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm transition-colors',
                rango === d ? 'bg-violet-600 text-white font-medium' : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {cargando ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !datos ? (
          <div className="text-center text-gray-400 py-20">Error cargando datos</div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard titulo="Total contactos" valor={datos.kpis.total_contactos.toLocaleString()} icono={Users} color="bg-violet-600" subtexto="en toda la base" />
              <KpiCard titulo="Conversaciones activas" valor={datos.kpis.conversaciones_activas} icono={MessageCircle} color="bg-emerald-500" subtexto="en curso ahora" />
              <KpiCard titulo="Tokens disponibles" valor={saldo.toLocaleString()} icono={Zap} color="bg-amber-500" subtexto={`${rango}d de uso`} />
              <KpiCard titulo="Tasa respuesta campanas" valor={`${datos.kpis.tasa_respuesta_campanas}%`} icono={TrendingUp} color="bg-blue-500" subtexto={`${datos.kpis.campanas_enviadas} campanas`} />
            </div>

            {/* Fila 1: Area chart contactos + conversaciones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Contactos por día */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Nuevos contactos</h3>
                {datos.contactos_por_dia.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Sin datos para el periodo</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={datos.contactos_por_dia.map(d => ({ ...d, dia: formatearDia(d.dia) }))}>
                      <defs>
                        <linearGradient id="gradContactos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6C47FF" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#6C47FF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="total" stroke="#6C47FF" fill="url(#gradContactos)" strokeWidth={2} name="Contactos" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Conversaciones por día */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Conversaciones iniciadas</h3>
                {datos.conversaciones_por_dia.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Sin datos para el periodo</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={datos.conversaciones_por_dia.map(d => ({ ...d, dia: formatearDia(d.dia) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="bot" stackId="a" fill="#6C47FF" name="IA" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="humano" stackId="a" fill="#10B981" name="Humano" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Fila 2: Tokens + Embudo */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Tokens por día */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Consumo de tokens IA</h3>
                <p className="text-xs text-gray-400 mb-4">Tokens por dia en el periodo seleccionado</p>
                {datos.tokens_por_dia.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Sin consumo en el periodo</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={datos.tokens_por_dia.map(d => ({ ...d, dia: formatearDia(d.dia) }))}>
                      <defs>
                        <linearGradient id="gradTokens" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                      <Tooltip formatter={(v) => typeof v === 'number' ? v.toLocaleString() : v} />
                      <Area type="monotone" dataKey="cantidad" stroke="#F59E0B" fill="url(#gradTokens)" strokeWidth={2} name="Tokens" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Embudo distribución */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Distribucion del embudo</h3>
                {datos.embudo.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Sin datos</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={datos.embudo} dataKey="total" nameKey="etapa" cx="50%" cy="50%" outerRadius={60} paddingAngle={2}>
                          {datos.embudo.map((_, i) => (
                            <Cell key={i} fill={COLORES_EMBUDO[i % COLORES_EMBUDO.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v, name) => [v, ETAPAS_LABELS[String(name)] ?? name]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-2">
                      {datos.embudo.map((e, i) => (
                        <div key={e.etapa} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORES_EMBUDO[i % COLORES_EMBUDO.length] }} />
                            <span className="text-gray-600">{ETAPAS_LABELS[e.etapa] ?? e.etapa}</span>
                          </div>
                          <span className="font-medium text-gray-900">{e.total}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Fila 3: Canales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Canales de origen */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Leads por canal de origen</h3>
                {datos.canales.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Sin datos para el periodo</div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={datos.canales} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="canal" type="category" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip />
                      <Bar dataKey="total" name="Contactos" radius={[0, 4, 4, 0]}>
                        {datos.canales.map((_, i) => (
                          <Cell key={i} fill={COLORES_CANAL[i % COLORES_CANAL.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Resumen IA */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Rendimiento del agente IA</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-lg">
                    <Bot size={20} className="text-violet-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-violet-900">Automatizacion activa</p>
                      <p className="text-xs text-violet-600 mt-0.5">
                        El agente IA gestiona conversaciones en modo BOT 24/7
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Conversaciones activas', valor: datos.kpis.conversaciones_activas, color: 'text-emerald-600' },
                      { label: 'Campanas enviadas', valor: datos.kpis.campanas_enviadas, color: 'text-violet-600' },
                      { label: 'Tasa respuesta', valor: `${datos.kpis.tasa_respuesta_campanas}%`, color: 'text-blue-600' },
                      { label: 'Tokens disponibles', valor: saldo.toLocaleString(), color: 'text-amber-600' },
                    ].map(item => (
                      <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                        <p className={cn('text-lg font-bold', item.color)}>{item.valor}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar size={11} />
                    Periodo: ultimos {rango} dias
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
