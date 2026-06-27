import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ProveedoresGlobales } from '@/components/compartidos/ProveedoresGlobales'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'InmoCRM.AI — CRM Inmobiliario con Inteligencia Artificial',
  description: 'Plataforma SaaS para inmobiliarias con agente IA conversacional, bandeja omnicanal y gestión inteligente de leads.',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#6C47FF',
  width: 'device-width',
  initialScale: 1,
}

export default function LayoutRaiz({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ProveedoresGlobales>
          {children}
        </ProveedoresGlobales>
      </body>
    </html>
  )
}
