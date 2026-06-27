import { NextRequest, NextResponse } from 'next/server'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { z } from 'zod'

const EsquemaToggle = z.object({
  conversacion_id: z.string().uuid(),
  estado: z.enum(['BOT', 'HUMANO', 'ABIERTO', 'CERRADO']),
})

export async function POST(req: NextRequest) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const cuerpo = await req.json()
  const validacion = EsquemaToggle.safeParse(cuerpo)
  if (!validacion.success) {
    return NextResponse.json({ error: 'Datos inválidos', detalles: validacion.error.issues }, { status: 400 })
  }

  const { conversacion_id, estado } = validacion.data

  // Verificar que la conversación pertenece al tenant del usuario
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!perfil) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

  const { error } = await supabase
    .from('conversaciones')
    .update({ estado })
    .eq('id', conversacion_id)
    .eq('tenant_id', perfil.tenant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, estado })
}
