'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { crearClienteNavegador } from '@/lib/supabase/cliente'
import type { Mensaje } from '@/types'

export function usarMensajes(conversacionId: string | null) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [cargando, setCargando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [botEscribiendo, setBotEscribiendo] = useState(false)
  const supabase = crearClienteNavegador()
  const contenedorRef = useRef<HTMLDivElement>(null)

  const cargarMensajes = useCallback(async () => {
    if (!conversacionId) return
    setCargando(true)

    const { data } = await supabase
      .from('mensajes')
      .select('*')
      .eq('conversacion_id', conversacionId)
      .order('timestamp', { ascending: true })
      .limit(100)

    setMensajes((data ?? []) as Mensaje[])
    setCargando(false)
  }, [conversacionId, supabase])

  useEffect(() => {
    setMensajes([])
    cargarMensajes()
  }, [conversacionId, cargarMensajes])

  // Scroll automático al último mensaje
  useEffect(() => {
    if (contenedorRef.current) {
      contenedorRef.current.scrollTop = contenedorRef.current.scrollHeight
    }
  }, [mensajes, botEscribiendo])

  // Suscripción Realtime a mensajes de esta conversación
  useEffect(() => {
    if (!conversacionId) return

    const canal = supabase
      .channel(`mensajes-${conversacionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `conversacion_id=eq.${conversacionId}`,
        },
        (payload) => {
          const nuevoMensaje = payload.new as Mensaje
          setMensajes(prev => {
            // Evitar duplicados
            if (prev.some(m => m.id === nuevoMensaje.id)) return prev
            return [...prev, nuevoMensaje]
          })
          // Si llega un mensaje del bot, ocultar indicador de escritura
          if (nuevoMensaje.rol === 'BOT') setBotEscribiendo(false)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [conversacionId, supabase])

  // Enviar mensaje como agente (actualización optimista)
  async function enviarMensaje(contenido: string, tenantId: string) {
    if (!conversacionId || !contenido.trim()) return
    setEnviando(true)

    // Inserción optimista local
    const mensajeTemporal: Mensaje = {
      id: `temp-${Date.now()}`,
      conversacion_id: conversacionId,
      rol: 'AGENTE',
      contenido,
      tipo: 'TEXTO',
      timestamp: new Date().toISOString(),
    }
    setMensajes(prev => [...prev, mensajeTemporal])

    const { error } = await supabase.from('mensajes').insert({
      conversacion_id: conversacionId,
      rol: 'AGENTE',
      contenido,
      tipo: 'TEXTO',
    })

    if (error) {
      // Revertir si falló
      setMensajes(prev => prev.filter(m => m.id !== mensajeTemporal.id))
    }

    setEnviando(false)
  }

  return {
    mensajes,
    cargando,
    enviando,
    botEscribiendo,
    setBotEscribiendo,
    enviarMensaje,
    contenedorRef,
  }
}
