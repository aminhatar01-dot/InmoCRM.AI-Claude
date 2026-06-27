import { NextResponse } from 'next/server'
import { crearClienteServidor } from '@/lib/supabase/servidor'

export async function GET() {
  try {
    const supabase = await crearClienteServidor()
    await supabase.from('tenants').select('id').limit(1)

    return NextResponse.json({
      estado: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
      servicios: {
        base_de_datos: 'ok',
        autenticacion: 'ok',
      },
    })
  } catch {
    return NextResponse.json(
      { estado: 'error', timestamp: new Date().toISOString() },
      { status: 503 }
    )
  }
}
