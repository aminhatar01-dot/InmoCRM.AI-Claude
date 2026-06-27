'use client'

import { useState } from 'react'
import { usarTenant } from '@/hooks/usarTenant'
import { usarConversaciones } from '@/hooks/usarConversaciones'
import { PanelConversaciones } from '@/components/bandeja/PanelConversaciones'
import { HiloMensajes } from '@/components/bandeja/HiloMensajes'
import { FichaContacto } from '@/components/bandeja/FichaContacto'
import { crearClienteNavegador } from '@/lib/supabase/cliente'
import type { Conversacion, FiltrosBandeja, Contacto } from '@/types'

export default function PaginaBandeja() {
  const { tenant } = usarTenant()
  const [conversacionSeleccionada, setConversacionSeleccionada] = useState<string | null>(null)
  const [filtros, setFiltros] = useState<FiltrosBandeja>({})
  const supabase = crearClienteNavegador()

  const { conversaciones, cargando } = usarConversaciones(tenant?.id ?? null, filtros)

  const convActual = conversaciones.find(c => c.id === conversacionSeleccionada) ?? null
  const config = (tenant?.configuracion as Record<string, string>) ?? {}
  const nombreAgente = config.nombre_agente ?? 'Sofia'

  async function cambiarEtapaContacto(etapa: string) {
    if (!convActual?.contacto_id) return
    await supabase
      .from('contactos')
      .update({ etapa })
      .eq('id', convActual.contacto_id)
  }

  return (
    <div className="flex h-full overflow-hidden">
      <PanelConversaciones
        conversaciones={conversaciones}
        conversacionSeleccionada={conversacionSeleccionada}
        onSeleccionar={setConversacionSeleccionada}
        filtros={filtros}
        onFiltros={setFiltros}
        cargando={cargando}
      />
      <HiloMensajes
        conversacion={convActual as Conversacion | null}
        tenantId={tenant?.id ?? ''}
        nombreAgente={nombreAgente}
      />
      <FichaContacto
        contacto={convActual?.contacto as Contacto | null}
        estadoConversacion={convActual?.estado ?? ''}
        onCambiarEtapa={cambiarEtapaContacto}
      />
    </div>
  )
}