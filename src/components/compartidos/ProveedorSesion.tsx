'use client'

import { useEffect } from 'react'
import { crearClienteNavegador } from '@/lib/supabase/cliente'
import { usarTenant } from '@/hooks/usarTenant'
import type { Tenant, Perfil } from '@/types'

export function ProveedorSesion({ children }: { children: React.ReactNode }) {
  const { establecerTenant, establecerPerfil, limpiar } = usarTenant()
  const supabase = crearClienteNavegador()

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { limpiar(); return }

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('*, tenants(*)')
        .eq('user_id', user.id)
        .eq('activo', true)
        .single()

      if (perfil) {
        establecerPerfil(perfil as Perfil)
        if (perfil.tenants) {
          establecerTenant(perfil.tenants as unknown as Tenant)
        }
      }
    }

    cargar()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === 'SIGNED_OUT') limpiar()
      else cargar()
    })

    return () => subscription.unsubscribe()
  }, [supabase, establecerTenant, establecerPerfil, limpiar])

  return <>{children}</>
}
