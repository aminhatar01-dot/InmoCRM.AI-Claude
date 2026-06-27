import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function actualizarSesion(solicitud: NextRequest) {
  let respuesta = NextResponse.next({
    request: solicitud,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return solicitud.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            solicitud.cookies.set(name, value)
          )
          respuesta = NextResponse.next({ request: solicitud })
          cookiesToSet.forEach(({ name, value, options }) =>
            respuesta.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = solicitud.nextUrl

  // Rutas protegidas de la aplicación
  const rutasProtegidas = ['/tablero', '/bandeja', '/contactos', '/embudo', '/propiedades', '/campanas', '/analiticas', '/integraciones', '/configuracion']
  const esRutaProtegida = rutasProtegidas.some(ruta => pathname.startsWith(ruta))

  if (esRutaProtegida && !user) {
    return NextResponse.redirect(new URL('/ingresar', solicitud.url))
  }

  // Redirigir usuario autenticado fuera del login/registro
  if ((pathname === '/ingresar' || pathname === '/registrarse') && user) {
    return NextResponse.redirect(new URL('/tablero', solicitud.url))
  }

  return respuesta
}
