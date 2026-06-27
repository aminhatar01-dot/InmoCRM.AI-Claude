import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...entradas: ClassValue[]) {
  return twMerge(clsx(entradas))
}

export function formatearFecha(fecha: string | Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(fecha))
}

export function formatearFechaHora(fecha: string | Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(fecha))
}

export function formatearPrecio(precio: number, moneda = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(precio)
}

export function tiempoRelativo(fecha: string | Date): string {
  const ahora = new Date()
  const objetivo = new Date(fecha)
  const diferencia = ahora.getTime() - objetivo.getTime()

  const minutos = Math.floor(diferencia / 60000)
  const horas = Math.floor(diferencia / 3600000)
  const dias = Math.floor(diferencia / 86400000)

  if (minutos < 1) return 'hace un momento'
  if (minutos < 60) return `hace ${minutos}m`
  if (horas < 24) return `hace ${horas}h`
  if (dias < 7) return `hace ${dias}d`
  return formatearFecha(fecha)
}

export function slugificar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const COLORES_CANAL: Record<string, string> = {
  whatsapp: '#25D366',
  instagram: '#E1306C',
  facebook: '#1877F2',
  web: '#6C47FF',
  mercadolibre: '#FFE600',
  manual: '#94A3B8',
}
