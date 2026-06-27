import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
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
        <Script id="sw-registro" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {})
            })
          }
        `}</Script>
      </body>
    </html>
  )
}
