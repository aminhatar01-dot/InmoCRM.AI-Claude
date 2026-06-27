'use client'

import { Bell, Search, ChevronDown, LogOut, User } from 'lucide-react'
import { crearClienteNavegador } from '@/lib/supabase/cliente'
import { useRouter } from 'next/navigation'

interface BarraSuperiorProps {
  nombreUsuario?: string
  nombreTenant?: string
}

export function BarraSuperior({ nombreUsuario = 'Usuario', nombreTenant = 'Mi Agencia' }: BarraSuperiorProps) {
  const router = useRouter()
  const supabase = crearClienteNavegador()

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push('/ingresar')
  }

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 flex-shrink-0">
      {/* Búsqueda global */}
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-72">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="Buscar contactos, conversaciones..."
          className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder:text-gray-400"
        />
        <kbd className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">⌘K</kbd>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-3">
        {/* Notificaciones */}
        <button className="relative w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-600 rounded-full" />
        </button>

        {/* Perfil */}
        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{nombreUsuario}</p>
            <p className="text-xs text-gray-500">{nombreTenant}</p>
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={cerrarSesion}
          className="w-9 h-9 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
          title="Cerrar sesión"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
