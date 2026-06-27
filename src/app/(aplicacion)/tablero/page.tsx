import { crearClienteServidor } from '@/lib/supabase/servidor'
import { BarChart3, Users, Inbox, Calendar, TrendingUp, MessageSquare } from 'lucide-react'

async function obtenerEstadisticas(tenantId: string) {
  const supabase = await crearClienteServidor()

  const [contactos, conversaciones, visitas, tokensHoy] = await Promise.all([
    supabase.from('contactos').select('id', { count: 'exact' }).eq('tenant_id', tenantId),
    supabase.from('conversaciones').select('id', { count: 'exact' }).eq('tenant_id', tenantId).eq('estado', 'ABIERTO'),
    supabase.from('visitas').select('id', { count: 'exact' }).eq('tenant_id', tenantId).eq('estado', 'PROGRAMADA'),
    supabase.from('uso_tokens').select('cantidad').eq('tenant_id', tenantId)
      .gte('timestamp', new Date(new Date().setHours(0,0,0,0)).toISOString()),
  ])

  const totalTokensHoy = (tokensHoy.data ?? []).reduce((acc, r) => acc + r.cantidad, 0)

  return {
    totalContactos: contactos.count ?? 0,
    conversacionesActivas: conversaciones.count ?? 0,
    visitasProgramadas: visitas.count ?? 0,
    tokensUsadosHoy: totalTokensHoy,
  }
}

export default async function PaginaTablero() {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('tenant_id, nombre')
    .eq('user_id', user!.id)
    .single()

  const stats = perfil ? await obtenerEstadisticas(perfil.tenant_id) : null

  const tarjetas = [
    { etiqueta: 'Total Contactos', valor: stats?.totalContactos ?? 0, icono: Users, color: 'bg-blue-50 text-blue-600', tendencia: '+12%' },
    { etiqueta: 'Conv. Activas', valor: stats?.conversacionesActivas ?? 0, icono: Inbox, color: 'bg-violet-50 text-violet-600', tendencia: '+5%' },
    { etiqueta: 'Visitas Hoy', valor: stats?.visitasProgramadas ?? 0, icono: Calendar, color: 'bg-emerald-50 text-emerald-600', tendencia: '+3' },
    { etiqueta: 'Tokens IA Hoy', valor: stats?.tokensUsadosHoy ?? 0, icono: MessageSquare, color: 'bg-amber-50 text-amber-600', tendencia: 'uso' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Buen día, {perfil?.nombre?.split(' ')[0] ?? 'Usuario'} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Esto es lo que está pasando en tu agencia hoy</p>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tarjetas.map(({ etiqueta, valor, icono: Icono, color, tendencia }) => (
          <div key={etiqueta} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                <Icono size={20} />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                {tendencia}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{valor.toLocaleString('es-AR')}</p>
            <p className="text-sm text-gray-500 mt-0.5">{etiqueta}</p>
          </div>
        ))}
      </div>

      {/* Área de bienvenida / onboarding */}
      <div className="bg-gradient-to-r from-violet-600 to-violet-700 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1">¡Bienvenido a InmoCRM.AI!</h2>
            <p className="text-violet-200 text-sm">
              Completá la configuración de tu agencia para sacar el máximo provecho
            </p>
            <div className="flex gap-3 mt-4">
              <a
                href="/configuracion"
                className="bg-white text-violet-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-50 transition-colors"
              >
                Configurar agente IA
              </a>
              <a
                href="/integraciones"
                className="bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-400 transition-colors"
              >
                Conectar WhatsApp
              </a>
            </div>
          </div>
          <BarChart3 size={48} className="text-violet-400 flex-shrink-0" />
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Conversaciones recientes</h3>
            <a href="/bandeja" className="text-violet-600 text-sm hover:underline">Ver todas →</a>
          </div>
          <div className="text-center py-8 text-gray-400">
            <Inbox size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Todavía no hay conversaciones</p>
            <p className="text-xs mt-1">Conectá WhatsApp para empezar</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Embudo de leads</h3>
            <a href="/embudo" className="text-violet-600 text-sm hover:underline">Ver embudo →</a>
          </div>
          <div className="space-y-3">
            {['Nuevo', 'Interesado', 'Visita agendada', 'Propuesta enviada'].map((etapa) => (
              <div key={etapa} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-32">{etapa}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-violet-600 h-2 rounded-full" style={{ width: '0%' }} />
                </div>
                <span className="text-sm font-medium text-gray-900 w-6">0</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
