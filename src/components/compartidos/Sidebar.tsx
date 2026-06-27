'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Inbox,
  Users,
  GitMerge,
  Building2,
  Megaphone,
  BarChart3,
  Plug,
  Settings,
  Bot,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utilidades'
import { useState } from 'react'

const itemsNav = [
  { href: '/tablero', etiqueta: 'Tablero', icono: LayoutDashboard },
  { href: '/bandeja', etiqueta: 'Bandeja', icono: Inbox },
  { href: '/contactos', etiqueta: 'Contactos', icono: Users },
  { href: '/embudo', etiqueta: 'Embudo', icono: GitMerge },
  { href: '/propiedades', etiqueta: 'Propiedades', icono: Building2 },
  { href: '/campanas', etiqueta: 'Campañas', icono: Megaphone },
  { href: '/analiticas', etiqueta: 'Analíticas', icono: BarChart3 },
  { href: '/integraciones', etiqueta: 'Integraciones', icono: Plug },
  { href: '/configuracion', etiqueta: 'Configuración', icono: Settings },
]

export function Sidebar() {
  const ruta = usePathname()
  const [colapsado, setColapsado] = useState(false)

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-[#0F0F14] border-r border-[#1a1a22] transition-all duration-300 relative',
        colapsado ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#1a1a22]">
        <div className="flex-shrink-0 w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
          <Bot size={18} className="text-white" />
        </div>
        {!colapsado && (
          <span className="text-white font-bold text-lg tracking-tight">
            InmoCRM<span className="text-violet-400">.AI</span>
          </span>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {itemsNav.map(({ href, etiqueta, icono: Icono }) => {
          const activo = ruta.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                activo
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:bg-[#1a1a22] hover:text-white'
              )}
              title={colapsado ? etiqueta : undefined}
            >
              <Icono size={18} className="flex-shrink-0" />
              {!colapsado && <span>{etiqueta}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Botón colapsar */}
      <button
        onClick={() => setColapsado(!colapsado)}
        className="absolute -right-3 top-20 w-6 h-6 bg-[#0F0F14] border border-[#1a1a22] rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
      >
        {colapsado ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
