'use client'

import { useState, useEffect, useCallback } from 'react'
import { crearClienteNavegador } from '@/lib/supabase/cliente'
import type { Propiedad } from '@/types'

interface FiltrosPropiedades {
  busqueda?: string
  tipo?: string
  operacion?: string
  estado?: string
  pagina?: number
}

const POR_PAGINA = 20

export function usarPropiedades(tenantId: string | null, filtros: FiltrosPropiedades = {}) {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([])
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
      .from('propiedades')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('creado_en', { ascending: false })
      .range(desde, hasta)

    if (filtros.busqueda) {
      query = query.or(`titulo.ilike.%${filtros.busqueda}%,direccion.ilike.%${filtros.busqueda}%,zona.ilike.%${filtros.busqueda}%`)
    }
    if (filtros.tipo) query = query.eq('tipo', filtros.tipo)
    if (filtros.operacion) query = query.eq('operacion', filtros.operacion)
    if (filtros.estado) query = query.eq('estado', filtros.estado)

    const { data, count, error } = await query
    if (!error && data) {
      setPropiedades(data as Propiedad[])
      setTotal(count ?? 0)
    }
    setCargando(false)
  }, [tenantId, filtros.busqueda, filtros.tipo, filtros.operacion, filtros.estado, filtros.pagina])

  useEffect(() => { cargar() }, [cargar])

  async function crearPropiedad(datos: Partial<Propiedad>) {
    if (!tenantId) return null
    const { data, error } = await supabase
      .from('propiedades')
      .insert({ ...datos, tenant_id: tenantId })
      .select()
      .single()
    if (!error) await cargar()
    return error ? null : (data as Propiedad)
  }

  async function actualizarPropiedad(id: string, datos: Partial<Propiedad>) {
    const { error } = await supabase
      .from('propiedades')
      .update(datos)
      .eq('id', id)
    if (!error) await cargar()
    return !error
  }

  async function eliminarPropiedad(id: string) {
    const { error } = await supabase
      .from('propiedades')
      .delete()
      .eq('id', id)
    if (!error) await cargar()
    return !error
  }

  return {
    propiedades,
    total,
    cargando,
    paginas: Math.ceil(total / POR_PAGINA),
    recargar: cargar,
    crearPropiedad,
    actualizarPropiedad,
    eliminarPropiedad,
  }
}
