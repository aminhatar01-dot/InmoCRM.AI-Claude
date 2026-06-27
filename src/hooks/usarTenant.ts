'use client'

import { create } from 'zustand'
import type { Tenant, Perfil } from '@/types'

interface EstadoTenant {
  tenant: Tenant | null
  perfil: Perfil | null
  establecerTenant: (tenant: Tenant) => void
  establecerPerfil: (perfil: Perfil) => void
  limpiar: () => void
}

export const usarTenant = create<EstadoTenant>((set) => ({
  tenant: null,
  perfil: null,
  establecerTenant: (tenant) => set({ tenant }),
  establecerPerfil: (perfil) => set({ perfil }),
  limpiar: () => set({ tenant: null, perfil: null }),
}))
