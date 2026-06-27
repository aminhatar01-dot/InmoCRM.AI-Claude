'use client'

import { useState, useEffect, useCallback } from 'react'
import { crearClienteNavegador } from '@/lib/supabase/cliente'
import type { Campana } from '@/types'

export function usarCampanas(tenantId: string | null) {
  const [campanas, setCampanas] = useState<Campana[]>([])
  const [cargando, setCargando] = useState(true)
  const supabase = crearClienteNavegador()

  const cargar = useCallback(async () => {
    if (!tenantId) return
    setCargando(true)
    const { data } = await supabase
      .from('campanas')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('creado_en', { ascending: false })
    if (data) setCampanas(data as Campana[])
    setCargando(false)
  }, [tenantId])

  useEffect(() => { cargar() }, [cargar])

  async function crearCampana(datos: Partial<Campana>) {
    if (!tenantId) return null
    const { data, error } = await supabase
      .from('campanas')
      .insert({ ...datos, tenant_id: tenantId, estado: 'BORRADOR' })
      .select()
      .single()
    if (!error) await cargar()
    return error ? null : (data as Campana)
  }

  async function actualizarCampana(id: string, datos: Partial<Campana>) {
    const { error } = await supabase.from('campanas').update(datos).eq('id', id)
    if (!error) await cargar()
    return !error
  }

  async function eliminarCampana(id: string) {
    const { error } = await supabase.from('campanas').delete().eq('id', id)
    if (!error) await cargar()
    return !error
  }

  async function lanzarCampana(id: string): Promise<{ ok: boolean; enviados: number; error?: string }> {
    const resp = await fetch(`/api/campanas/${id}/enviar`, { method: 'POST' })
    const json = await resp.json()
    await cargar()
    return json
  }

  return { campanas, cargando, recargar: cargar, crearCampana, actualizarCampana, eliminarCampana, lanzarCampana }
}
