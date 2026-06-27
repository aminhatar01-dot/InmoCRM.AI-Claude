import { redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/servidor'

export default async function LayoutAutenticacion({
  children,
}: {
  children: React.ReactNode
}) {
  // Si ya está autenticado, redirigir al tablero
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()

  // Excepción: onboarding sí puede verlo un usuario autenticado
  if (user) {
    // El middleware ya maneja la redirección para ingresar/registrarse
    // Solo redirigimos desde el layout si no hay ruta de onboarding
  }

  return <>{children}</>
}
