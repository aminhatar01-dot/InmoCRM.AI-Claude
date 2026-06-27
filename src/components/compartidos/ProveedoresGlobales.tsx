'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ProveedorSesion } from './ProveedorSesion'

export function ProveedoresGlobales({ children }: { children: React.ReactNode }) {
  const [clienteQuery] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={clienteQuery}>
      <ProveedorSesion>
        {children}
      </ProveedorSesion>
    </QueryClientProvider>
  )
}
