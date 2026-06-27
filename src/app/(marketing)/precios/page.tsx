import { Check, Zap, MessageCircle, Bot, BarChart3, Shield } from 'lucide-react'
import Link from 'next/link'

const PLANES = [
  {
    id: 'basico',
    nombre: 'Basico',
    precio: 29,
    descripcion: 'Para agencias que arrancan con IA',
    tokens: '50.000',
    color: 'border-gray-200',
    botonClase: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    features: [
      '1 canal de mensajes (WhatsApp)',
      '50.000 tokens de IA por mes',
      'Hasta 500 contactos',
      'Bandeja omnicanal',
      'Embudo Kanban',
      'Soporte por email',
    ],
  },
  {
    id: 'pro',
    nombre: 'Pro',
    precio: 79,
    descripcion: 'Para agencias en crecimiento activo',
    tokens: '200.000',
    destacado: true,
    color: 'border-violet-400',
    botonClase: 'bg-violet-600 text-white hover:bg-violet-700',
    features: [
      'Canales ilimitados (WhatsApp, IG, FB, MeLi)',
      '200.000 tokens de IA por mes',
      'Contactos ilimitados',
      'Campanas broadcast WhatsApp',
      'Sync con Tokko Broker',
      'Follow-up automatico (secuencias)',
      'Analiticas avanzadas',
      'Soporte prioritario',
    ],
  },
  {
    id: 'enterprise',
    nombre: 'Enterprise',
    precio: 199,
    descripcion: 'Para grandes equipos y franquicias',
    tokens: '1.000.000',
    color: 'border-gray-200',
    botonClase: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    features: [
      'Todo lo de Pro',
      '1.000.000 tokens de IA por mes',
      'Multi-sucursal (multi-tenant)',
      'SLA de uptime 99.9%',
      'Soporte 24/7 con SLA',
      'Onboarding dedicado',
      'API y webhooks personalizados',
      'Reportes white-label',
    ],
  },
]

const COMPARACION = [
  { feature: 'Agente IA conversacional', basico: true, pro: true, enterprise: true },
  { feature: 'Bandeja omnicanal', basico: true, pro: true, enterprise: true },
  { feature: 'Pipeline Kanban', basico: true, pro: true, enterprise: true },
  { feature: 'Catalogo de propiedades', basico: true, pro: true, enterprise: true },
  { feature: 'Campanas broadcast', basico: false, pro: true, enterprise: true },
  { feature: 'Sync Tokko Broker', basico: false, pro: true, enterprise: true },
  { feature: 'Follow-up automatico', basico: false, pro: true, enterprise: true },
  { feature: 'Analiticas avanzadas', basico: false, pro: true, enterprise: true },
  { feature: 'Multi-sucursal', basico: false, pro: false, enterprise: true },
  { feature: 'API personalizada', basico: false, pro: false, enterprise: true },
  { feature: 'Onboarding dedicado', basico: false, pro: false, enterprise: true },
]

const FAQS = [
  {
    q: 'Que son los tokens de IA?',
    a: 'Los tokens son la unidad de consumo del agente de inteligencia artificial. Cada mensaje que procesa el agente consume tokens. 1.000 tokens equivalen aproximadamente a 750 palabras procesadas.',
  },
  {
    q: 'Puedo cambiar de plan en cualquier momento?',
    a: 'Si. Podes subir o bajar de plan desde la seccion de configuracion. Los cambios se aplican de forma inmediata y la diferencia de precio se prorratea.',
  },
  {
    q: 'Que pasa si se me terminan los tokens?',
    a: 'Podes recargar tokens adicionales desde la seccion de billing en cualquier momento. Tambien podes configurar recargas automaticas cuando el saldo baje de cierto umbral.',
  },
  {
    q: 'Es compatible con WhatsApp Business API oficial?',
    a: 'Si. InmoCRM.AI usa la API oficial de Meta para WhatsApp Business, por lo que es completamente compatible y no viola los terminos de servicio.',
  },
  {
    q: 'Necesito saber programar para usarlo?',
    a: 'No. La plataforma esta disenada para que cualquier persona pueda configurarla desde el wizard de onboarding en menos de 10 minutos, sin conocimientos tecnicos.',
  },
]

export default function PaginaPrecios() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="text-xl font-bold text-violet-600">InmoCRM.AI</Link>
        <div className="flex items-center gap-4">
          <Link href="/ingresar" className="text-sm text-gray-600 hover:text-gray-900">Ingresar</Link>
          <Link href="/registrarse" className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">
            Empezar gratis
          </Link>
        </div>
      </nav>

      {/* Hero precios */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-semibold text-violet-600 uppercase tracking-widest bg-violet-50 px-3 py-1 rounded-full">
            Precios simples y transparentes
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mt-4 mb-4">
            El CRM que se paga solo
          </h1>
          <p className="text-lg text-gray-500">
            Planes para cada etapa de tu agencia. Sin comisiones por venta, sin contratos minimos.
            Cancela cuando quieras.
          </p>
        </div>
      </section>

      {/* Planes */}
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANES.map(plan => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-7 ${plan.color} ${plan.destacado ? 'shadow-xl' : 'shadow-sm'}`}
            >
              {plan.destacado && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs px-4 py-1 rounded-full font-semibold">
                  Mas popular
                </div>
              )}
              <h2 className="text-xl font-bold text-gray-900">{plan.nombre}</h2>
              <p className="text-sm text-gray-500 mt-1 mb-4">{plan.descripcion}</p>
              <div className="mb-2">
                <span className="text-4xl font-bold text-gray-900">${plan.precio}</span>
                <span className="text-gray-400 text-sm"> / mes</span>
              </div>
              <p className="text-sm text-violet-600 font-medium mb-6 flex items-center gap-1.5">
                <Zap size={13} /> {plan.tokens} tokens de IA incluidos
              </p>
              <Link
                href="/registrarse"
                className={`block w-full text-center px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${plan.botonClase} mb-6`}
              >
                Comenzar ahora
              </Link>
              <ul className="space-y-2.5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Check size={14} className="text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Features destacadas */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Incluido en todos los planes</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { icono: Bot, titulo: 'Agente IA 24/7', desc: 'Responde leads automaticamente en WhatsApp con IA entrenada en tu catalogo' },
              { icono: MessageCircle, titulo: 'Bandeja omnicanal', desc: 'Todos tus canales en una sola pantalla. WhatsApp, Instagram, web y mas' },
              { icono: BarChart3, titulo: 'Analiticas en tiempo real', desc: 'Dashboard con metricas de conversion, uso de tokens y rendimiento del agente' },
              { icono: Shield, titulo: 'Seguridad empresarial', desc: 'RLS multi-tenant, cifrado AES-256 de credenciales, HMAC en webhooks' },
              { icono: Zap, titulo: 'Automatizaciones', desc: 'Follow-up automatico, recordatorios de visitas y campanas programadas' },
              { icono: Check, titulo: 'Sin configuracion compleja', desc: 'Onboarding de 5 pasos. Conectas WhatsApp y tu IA queda activa en minutos' },
            ].map(({ icono: Icono, titulo, desc }) => (
              <div key={titulo} className="flex items-start gap-3">
                <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icono size={16} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{titulo}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabla comparacion */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Comparacion detallada</h2>
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-sm font-semibold text-gray-700 px-6 py-4">Funcionalidad</th>
                  {PLANES.map(p => (
                    <th key={p.id} className="text-center text-sm font-semibold text-gray-700 px-4 py-4">{p.nombre}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARACION.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="text-sm text-gray-700 px-6 py-3">{row.feature}</td>
                    {(['basico', 'pro', 'enterprise'] as const).map(plan => (
                      <td key={plan} className="text-center px-4 py-3">
                        {row[plan]
                          ? <Check size={16} className="text-emerald-500 mx-auto" />
                          : <span className="text-gray-300 text-sm">-</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Preguntas frecuentes</h2>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="font-semibold text-gray-900 mb-2">{q}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Empeza hoy sin riesgos</h2>
          <p className="text-gray-500 mb-8">14 dias de prueba gratis en el plan Pro. Sin tarjeta de credito.</p>
          <Link
            href="/registrarse"
            className="inline-flex items-center gap-2 px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-base font-semibold shadow-lg shadow-violet-200 transition-colors"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6 text-center text-sm text-gray-400">
        <p>InmoCRM.AI - Hecho para inmobiliarias de Latinoamerica</p>
      </footer>
    </main>
  )
}
