import { redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { Sidebar } from '@/components/compartidos/Sidebar'
import { BarraSuperior } from '@/components/compartidos/BarraSuperior'

export default async function LayoutAplicacion({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/ingresar')
  }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre, tenants(nombre)')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <BarraSuperior
          nombreUsuario={perfil?.nombre ?? user.email ?? 'Usuario'}
          nombreTenant={(perfil?.tenants as unknown as { nombre: string } | null)?.nombre ?? 'Mi Agencia'}
        />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
