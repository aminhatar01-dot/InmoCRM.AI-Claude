import Link from 'next/link'
import { Bot, Zap, Shield, BarChart3, MessageSquare, Users, Building2, Check } from 'lucide-react'

export default function PaginaInicio() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">InmoCRM<span className="text-violet-600">.AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <Link href="#funcionalidades" className="hover:text-gray-900">Funcionalidades</Link>
            <Link href="/precios" className="hover:text-gray-900">Precios</Link>
            <Link href="/blog" className="hover:text-gray-900">Blog</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/ingresar" className="text-sm text-gray-600 hover:text-gray-900">Ingresar</Link>
            <Link href="/registrarse" className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors">
              Empezar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <span className="inline-block bg-violet-50 text-violet-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
          🚀 El CRM inmobiliario nativo en IA
        </span>
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Tu agente IA vende{' '}
          <span className="text-violet-600">propiedades</span>{' '}
          mientras dormís
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8">
          InmoCRM.AI responde leads en segundos, agenda visitas automáticamente y mantiene tu embudo lleno — por WhatsApp, Instagram y más.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/registrarse"
            className="bg-violet-600 text-white px-6 py-3 rounded-xl font-medium text-lg hover:bg-violet-700 transition-colors"
          >
            Empezar 7 días gratis →
          </Link>
          <Link
            href="#funcionalidades"
            className="border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium text-lg hover:bg-gray-50 transition-colors"
          >
            Ver funcionalidades
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-4">Sin tarjeta de crédito · Configuración en 5 minutos</p>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Todo lo que necesita tu inmobiliaria
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icono: MessageSquare, titulo: 'Bandeja Omnicanal', desc: 'WhatsApp, Instagram, Facebook y más — todo en un solo lugar con respuesta en tiempo real.' },
              { icono: Bot, titulo: 'Agente IA de Ventas', desc: 'Tu agente personalizado que conoce tu catálogo, agenda visitas y califica leads 24/7.' },
              { icono: Users, titulo: 'CRM Inteligente', desc: 'Etiquetas smart automáticas, embudo visual y seguimientos basados en IA.' },
              { icono: Building2, titulo: 'Catálogo de Propiedades', desc: 'Sync con Tokko Broker, búsqueda semántica con IA y generación de brochures.' },
              { icono: BarChart3, titulo: 'Analíticas Avanzadas', desc: 'Métricas de conversión, rendimiento por agente y consumo de IA en tiempo real.' },
              { icono: Zap, titulo: 'Automatizaciones', desc: 'Seguimientos automáticos, recordatorios y campañas de WhatsApp masivas.' },
            ].map(({ icono: Icono, titulo, desc }) => (
              <div key={titulo} className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center mb-4">
                  <Icono size={20} className="text-violet-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{titulo}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Precios preview */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Planes simples y transparentes</h2>
        <p className="text-center text-gray-500 mb-12">Comenzá gratis, escalá cuando lo necesites</p>
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { nombre: 'Básico', precio: 49, features: ['1 canal', '500 contactos', '5.000 tokens IA/mes', '1 usuario'], popular: false },
            { nombre: 'Pro', precio: 99, features: ['3 canales', 'Contactos ilimitados', '20.000 tokens IA/mes', '5 usuarios', 'Tokko Broker'], popular: true },
            { nombre: 'Enterprise', precio: 149, features: ['Canales ilimitados', 'Contactos ilimitados', '50.000 tokens IA/mes', 'Usuarios ilimitados', 'API access'], popular: false },
          ].map(({ nombre, precio, features, popular }) => (
            <div key={nombre} className={`rounded-2xl border p-6 ${popular ? 'border-violet-600 shadow-lg shadow-violet-100' : 'border-gray-200'}`}>
              {popular && <span className="bg-violet-600 text-white text-xs px-2 py-1 rounded-full mb-3 inline-block">Más popular</span>}
              <h3 className="font-bold text-gray-900 text-lg">{nombre}</h3>
              <div className="flex items-baseline gap-1 my-3">
                <span className="text-3xl font-bold text-gray-900">${precio}</span>
                <span className="text-gray-500 text-sm">/mes</span>
              </div>
              <ul className="space-y-2 mb-6">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={14} className="text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/registrarse"
                className={`block text-center py-2.5 rounded-lg text-sm font-medium transition-colors ${popular ? 'bg-violet-600 text-white hover:bg-violet-700' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                Empezar gratis
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-violet-600 rounded flex items-center justify-center">
              <Bot size={12} className="text-white" />
            </div>
            <span className="text-sm font-medium text-gray-900">InmoCRM.AI</span>
          </div>
          <p className="text-sm text-gray-400">© 2024 InmoCRM.AI · Todos los derechos reservados</p>
          <div className="flex gap-4 text-sm text-gray-400">
            <Link href="/privacidad" className="hover:text-gray-600">Privacidad</Link>
            <Link href="/terminos" className="hover:text-gray-600">Términos</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
