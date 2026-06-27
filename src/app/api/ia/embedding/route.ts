import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { crearClienteServidor } from '@/lib/supabase/servidor'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { texto } = await req.json()
  if (!texto) return NextResponse.json({ error: 'Falta texto' }, { status: 400 })

  const respuesta = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texto,
  })

  return NextResponse.json({ embedding: respuesta.data[0].embedding })
}
