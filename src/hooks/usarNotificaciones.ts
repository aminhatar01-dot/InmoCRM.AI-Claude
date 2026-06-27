'use client'

import { useState, useEffect } from 'react'
import { crearClienteNavegador } from '@/lib/supabase/cliente'

export interface Notificacion {
  id: string
  tipo: string
  titulo: string
  cuerpo?: string
  leida: boolean
  datos: Record<string, string>
  creado_en: string
}

export function usarNotificaciones(userId: string | null) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const supabase = crearClienteNavegador()

  useEffect(() => {
    if (!userId) return

    // Carga inicial
    supabase
      .from('notificaciones')
      .select('*')
      .eq('user_id', userId)
      .eq('leida', false)
      .order('creado_en', { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setNotificaciones(data as Notificacion[]) })

    // Suscripción Realtime
    const canal = supabase
      .channel('notificaciones-usuario')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notificaciones',
        filter: `user_id=eq.${userId}`,
      }, payload => {
        setNotificaciones(prev => [payload.new as Notificacion, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [userId])

  async function marcarLeida(id: string) {
    await supabase.from('notificaciones').update({ leida: true }).eq('id', id)
    setNotificaciones(prev => prev.filter(n => n.id !== id))
  }

  async function marcarTodasLeidas() {
    if (!userId) return
    await supabase.from('notificaciones').update({ leida: true }).eq('user_id', userId)
    setNotificaciones([])
  }

  return {
    notificaciones,
    sinLeer: notificaciones.length,
    marcarLeida,
    marcarTodasLeidas,
  }
}
