'use client'

import { useEffect, useState, useCallback } from 'react'
import { crearClienteNavegador } from '@/lib/supabase/cliente'
import type { Conversacion, FiltrosBandeja } from '@/types'

export function usarConversaciones(tenantId: string | null, filtros: FiltrosBandeja = {}) {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [cargando, setCargando] = useState(true)

  const supabase = crearClienteNavegador()

  const cargarConversaciones = useCallback(async () => {
    if (!tenantId) return
    setCargando(true)

    let consulta = supabase
      .from('conversaciones')
      .select(`
        *,
        contacto:contactos(id, nombre, telefono, canal_origen, etiquetas_smart, etapa),
        mensajes(contenido, timestamp, rol)
      `)
      .eq('tenant_id', tenantId)
      .order('ultimo_mensaje_en', { ascending: false })
      .limit(50)

    if (filtros.canal) consulta = consulta.eq('canal', filtros.canal)
    if (filtros.etapa) consulta = consulta.eq('contacto.etapa', filtros.etapa)

    const { data } = await consulta

    if (data) {
      const mapeadas = data.map(c => ({
        ...c,
        ultimo_mensaje: (c.mensajes as Array<{ contenido: string; timestamp: string }>)
          ?.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.contenido,
      }))

      // Filtrar por búsqueda en frontend
      const filtradas = filtros.busqueda
        ? mapeadas.filter(c =>
            c.contacto?.nombre?.toLowerCase().includes(filtros.busqueda!.toLowerCase()) ||
            c.contacto?.telefono?.includes(filtros.busqueda!)
          )
        : mapeadas

      setConversaciones(filtradas as Conversacion[])
    }
    setCargando(false)
  }, [tenantId, filtros.canal, filtros.etapa, filtros.busqueda, supabase])

  useEffect(() => {
    cargarConversaciones()
  }, [cargarConversaciones])

  // Suscripción Realtime para nuevos mensajes y cambios de conversación
  useEffect(() => {
    if (!tenantId) return

    const canal = supabase
      .channel(`bandeja-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversaciones',
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => cargarConversaciones()
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
        },
        () => cargarConversaciones()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [tenantId, supabase, cargarConversaciones])

  return { conversaciones, cargando, recargar: cargarConversaciones }
}
