'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bot, Mail, Lock, User, Building2, ArrowRight } from 'lucide-react'
import { crearClienteNavegador } from '@/lib/supabase/cliente'
import { slugificar } from '@/lib/utilidades'

export default function PaginaRegistrarse() {
  const router = useRouter()
  const supabase = crearClienteNavegador()
  const [paso, setPaso] = useState(1)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [datos, setDatos] = useState({
    nombre: '',
    email: '',
    contrasena: '',
    nombreAgencia: '',
    pais: 'Argentina',
    zonaHoraria: 'America/Argentina/Buenos_Aires',
  })

  function actualizarDato(clave: keyof typeof datos, valor: string) {
    setDatos(prev => ({ ...prev, [clave]: valor }))
  }

  async function manejarRegistro(e: React.FormEvent) {
    e.preventDefault()
    if (paso === 1) { setPaso(2); return }

    setCargando(true)
    setError(null)

    const { data: dataAuth, error: errorAuth } = await supabase.auth.signUp({
      email: datos.email,
      password: datos.contrasena,
    })

    if (errorAuth || !dataAuth.user) {
      setError(errorAuth?.message ?? 'Error al crear la cuenta. Intentá con otro email.')
      setCargando(false)
      return
    }

    const slug = slugificar(datos.nombreAgencia) + '-' + Math.random().toString(36).slice(2, 6)

    const { data: tenant, error: errorTenant } = await supabase
      .from('tenants')
      .insert({
        nombre: datos.nombreAgencia,
        slug,
        configuracion: {
          pais: datos.pais,
          zona_horaria: datos.zonaHoraria,
        },
      })
      .select()
      .single()

    if (errorTenant || !tenant) {
      setError('Error al crear la agencia. Contactá soporte.')
      setCargando(false)
      return
    }

    await supabase.from('perfiles').insert({
      tenant_id: tenant.id,
      user_id: dataAuth.user.id,
      nombre: datos.nombre,
      email: datos.email,
      rol: 'PROPIETARIO',
    })

    router.push('/onboarding')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
              <Bot size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              InmoCRM<span className="text-violet-600">.AI</span>
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {/* Indicador de pasos */}
          <div className="flex gap-2 mb-6">
            {[1, 2].map(p => (
              <div
                key={p}
                className={`h-1.5 flex-1 rounded-full transition-colors ${p <= paso ? 'bg-violet-600' : 'bg-gray-200'}`}
              />
            ))}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {paso === 1 ? 'Tu cuenta' : 'Tu agencia'}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {paso === 1 ? 'Creá tu cuenta de InmoCRM.AI' : 'Datos de tu inmobiliaria'}
          </p>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={manejarRegistro} className="space-y-4">
            {paso === 1 ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tu nombre</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={datos.nombre}
                      onChange={e => actualizarDato('nombre', e.target.value)}
                      required
                      placeholder="Juan García"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={datos.email}
                      onChange={e => actualizarDato('email', e.target.value)}
                      required
                      placeholder="juan@agencia.com"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      value={datos.contrasena}
                      onChange={e => actualizarDato('contrasena', e.target.value)}
                      required
                      minLength={8}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la agencia</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={datos.nombreAgencia}
                      onChange={e => actualizarDato('nombreAgencia', e.target.value)}
                      required
                      placeholder="InmoPalermo S.A."
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">País</label>
                  <select
                    value={datos.pais}
                    onChange={e => actualizarDato('pais', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="Argentina">Argentina</option>
                    <option value="Uruguay">Uruguay</option>
                    <option value="Chile">Chile</option>
                    <option value="Colombia">Colombia</option>
                    <option value="México">México</option>
                    <option value="España">España</option>
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {cargando ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>{paso === 1 ? 'Continuar' : 'Crear cuenta gratis'} <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            7 días gratis · Sin tarjeta de crédito
          </p>

          <p className="text-center text-sm text-gray-500 mt-4">
            ¿Ya tenés cuenta?{' '}
            <Link href="/ingresar" className="text-violet-600 font-medium hover:underline">
              Ingresar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
