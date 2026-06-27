'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Search, ChevronDown, LogOut, User, X, Check } from 'lucide-react'
import { crearClienteNavegador } from '@/lib/supabase/cliente'
import { useRouter } from 'next/navigation'
import { usarNotificaciones } from '@/hooks/usarNotificaciones'
import { tiempoRelativo } from '@/lib/utilidades'

interface BarraSuperiorProps {
  nombreUsuario?: string
  nombreTenant?: string
  userId?: string
}

const ICONOS_NOTIFICACION: Record<string, string> = {
  nuevo_lead: '🤝',
  escalacion: '🚨',
  visita_prox: '🏠',
  tokens_bajos: '⚡',
  campana_completada: '📣',
  recordatorio_detectado: '🔔',
}

export function BarraSuperior({ nombreUsuario = 'Usuario', nombreTenant = 'Mi Agencia', userId }: BarraSuperiorProps) {
  const router = useRouter()
  const supabase = crearClienteNavegador()
  const [panelAbierto, setPanelAbierto] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const { notificaciones, sinLeer, marcarLeida, marcarTodasLeidas } = usarNotificaciones(userId ?? null)

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push('/ingresar')
  }

  // Cerrar panel al hacer click fuera
  useEffect(() => {
    function manejarClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelAbierto(false)
      }
    }
    document.addEventListener('mousedown', manejarClick)
    return () => document.removeEventListener('mousedown', manejarClick)
  }, [])

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
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setPanelAbierto(!panelAbierto)}
            className="relative w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
          >
            <Bell size={18} />
            {sinLeer > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-violet-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {sinLeer > 9 ? '9+' : sinLeer}
              </span>
            )}
          </button>

          {/* Panel de notificaciones */}
          {panelAbierto && (
            <div className="absolute right-0 top-11 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
                {sinLeer > 0 && (
                  <button
                    onClick={marcarTodasLeidas}
                    className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"
                  >
                    <Check size={11} /> Marcar todas leidas
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notificaciones.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <Bell size={24} className="mb-2 opacity-40" />
                    <p className="text-sm">Sin notificaciones</p>
                  </div>
                ) : (
                  notificaciones.map(notif => (
                    <div
                      key={notif.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      <span className="text-lg flex-shrink-0 mt-0.5">
                        {ICONOS_NOTIFICACION[notif.tipo] ?? '🔔'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{notif.titulo}</p>
                        {notif.cuerpo && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.cuerpo}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">{tiempoRelativo(notif.creado_en)}</p>
                      </div>
                      <button
                        onClick={() => marcarLeida(notif.id)}
                        className="w-6 h-6 rounded hover:bg-gray-200 flex items-center justify-center text-gray-400 flex-shrink-0"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
          title="Cerrar sesion"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
