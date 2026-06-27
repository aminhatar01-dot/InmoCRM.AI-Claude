import { cn, COLORES_CANAL } from '@/lib/utilidades'
import type { CanalOrigen } from '@/types'

const EMOJIS_CANAL: Record<string, string> = {
  whatsapp: '💬',
  instagram: '📸',
  facebook: '👥',
  web: '🌐',
  mercadolibre: '🛒',
  manual: '✏️',
}

interface InsigniaCanalProps {
  canal: CanalOrigen
  tamanio?: 'sm' | 'md'
  mostrarTexto?: boolean
}

export function InsigniaCanal({ canal, tamanio = 'sm', mostrarTexto = false }: InsigniaCanalProps) {
  const emoji = EMOJIS_CANAL[canal] ?? '💬'
  const tamClase = tamanio === 'sm' ? 'w-5 h-5 text-xs' : 'w-7 h-7 text-sm'

  return (
    <div className={cn('rounded-full flex items-center justify-center flex-shrink-0', tamClase)}
      style={{ backgroundColor: COLORES_CANAL[canal] + '20' }}
      title={canal}
    >
      <span>{emoji}</span>
      {mostrarTexto && <span className="ml-1 capitalize text-xs">{canal}</span>}
    </div>
  )
}
