'use client'

import { useState, useEffect, useCallback } from 'react'
import { crearClienteNavegador } from '@/lib/supabase/cliente'
import type { Contacto } from '@/types'

interface FiltrosContactos {
  busqueda?: string
  etapa?: string
  etiqueta?: string
  canal?: string
  pagina?: number
}

const POR_PAGINA = 25

export function usarContactos(tenantId: string | null, filtros: FiltrosContactos = {}) {
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(true)
  const supabase = crearClienteNavegador()

  const cargar = useCallback(async () => {
    if (!tenantId) return
    setCargando(true)
    const pagina = filtros.pagina ?? 0
    const desde = pagina * POR_PAGINA
    const hasta = desde + POR_PAGINA - 1

    let query = supabase
      .from('contactos')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('creado_en', { ascending: false })
      .range(desde, hasta)

    if (filtros.busqueda) {
      query = query.or(`nombre.ilike.%${filtros.busqueda}%,telefono.ilike.%${filtros.busqueda}%,email.ilike.%${filtros.busqueda}%`)
    }
    if (filtros.etapa) query = query.eq('etapa', filtros.etapa)
    if (filtros.canal) query = query.eq('canal_origen', filtros.canal)
    if (filtros.etiqueta) query = query.contains('etiquetas_smart', [filtros.etiqueta])

    const { data, count, error } = await query
    if (!error && data) {
      setContactos(data as Contacto[])
      setTotal(count ?? 0)
    }
    setCargando(false)
  }, [tenantId, filtros.busqueda, filtros.etapa, filtros.canal, filtros.etiqueta, filtros.pagina])

  useEffect(() => { cargar() }, [cargar])

  async function crearContacto(datos: Partial<Contacto>) {
    if (!tenantId) return null
    const { data, error } = await supabase
      .from('contactos')
      .insert({ ...datos, tenant_id: tenantId })
      .select()
      .single()
    if (!error) await cargar()
    return error ? null : (data as Contacto)
  }

  async function actualizarContacto(id: string, datos: Partial<Contacto>) {
    const { error } = await supabase
      .from('contactos')
      .update(datos)
      .eq('id', id)
    if (!error) await cargar()
    return !error
  }

  async function eliminarContacto(id: string) {
    const { error } = await supabase
      .from('contactos')
      .delete()
      .eq('id', id)
    if (!error) await cargar()
    return !error
  }

  return {
    contactos,
    total,
    cargando,
    paginas: Math.ceil(total / POR_PAGINA),
    recargar: cargar,
    crearContacto,
    actualizarContacto,
    eliminarContacto,
  }
}
