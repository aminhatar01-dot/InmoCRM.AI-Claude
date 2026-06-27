'use client'

import { useEffect, useState } from 'react'
import { crearClienteNavegador } from '@/lib/supabase/cliente'
import type { Perfil, Tenant } from '@/types'

interface SesionUsuario {
  perfil: Perfil | null
  tenant: Tenant | null
  cargando: boolean
  error: string | null
}

export function usarSesion(): SesionUsuario {
  const [estado, setEstado] = useState<SesionUsuario>({
    perfil: null,
    tenant: null,
    cargando: true,
    error: null,
  })

  useEffect(() => {
    const supabase = crearClienteNavegador()

    async function cargarSesion() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setEstado({ perfil: null, tenant: null, cargando: false, error: null })
        return
      }

      const { data: perfil, error } = await supabase
        .from('perfiles')
        .select('*, tenants(*)')
        .eq('user_id', user.id)
        .single()

      if (error || !perfil) {
        setEstado({ perfil: null, tenant: null, cargando: false, error: 'Error al cargar perfil' })
        return
      }

      setEstado({
        perfil: perfil as Perfil,
        tenant: perfil.tenants as unknown as Tenant,
        cargando: false,
        error: null,
      })
    }

    cargarSesion()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      cargarSesion()
    })

    return () => subscription.unsubscribe()
  }, [])

  return estado
}
