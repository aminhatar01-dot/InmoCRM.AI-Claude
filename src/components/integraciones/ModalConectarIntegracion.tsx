'use client'

import { useState } from 'react'
import { X, Eye, EyeOff, AlertTriangle } from 'lucide-react'

interface CampoCredencial {
  clave: string
  label: string
  tipo: 'text' | 'password' | 'url'
  placeholder: string
  ayuda?: string
}

const CAMPOS_POR_TIPO: Record<string, CampoCredencial[]> = {
  whatsapp: [
    { clave: 'phone_number_id', label: 'Phone Number ID', tipo: 'text', placeholder: '1234567890', ayuda: 'Encontralo en Meta for Developers > WhatsApp > API Setup' },
    { clave: 'token_acceso', label: 'Token de acceso permanente', tipo: 'password', placeholder: 'EAA...', ayuda: 'Genera un token permanente en Meta Business Suite' },
    { clave: 'verify_token', label: 'Token de verificación (webhook)', tipo: 'text', placeholder: 'mi_token_secreto', ayuda: 'Un string cualquiera que usarás en el webhook de Meta' },
  ],
  tokko: [
    { clave: 'api_key', label: 'API Key de Tokko Broker', tipo: 'password', placeholder: 'tk_...', ayuda: 'Encontrala en Tokko > Configuracion > API' },
  ],
  instagram: [
    { clave: 'page_id', label: 'Page ID de Facebook', tipo: 'text', placeholder: '1234567890' },
    { clave: 'token_acceso', label: 'Token de acceso', tipo: 'password', placeholder: 'EAA...' },
  ],
  mercadolibre: [
    { clave: 'client_id', label: 'Client ID', tipo: 'text', placeholder: '1234567890' },
    { clave: 'client_secret', label: 'Client Secret', tipo: 'password', placeholder: 'abc123...' },
    { clave: 'access_token', label: 'Access Token', tipo: 'password', placeholder: 'APP_USR-...' },
  ],
  google_calendar: [
    { clave: 'client_id', label: 'Client ID de Google', tipo: 'text', placeholder: '123-abc.apps.googleusercontent.com' },
    { clave: 'client_secret', label: 'Client Secret', tipo: 'password', placeholder: 'GOCSPX-...' },
  ],
}

interface ModalConectarIntegracionProps {
  tipo: string
  nombreIntegracion: string
  onGuardar: (tipo: string, credenciales: Record<string, string>) => Promise<boolean>
  onCerrar: () => void
}

export function ModalConectarIntegracion({ tipo, nombreIntegracion, onGuardar, onCerrar }: ModalConectarIntegracionProps) {
  const campos = CAMPOS_POR_TIPO[tipo] ?? []
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(campos.map(c => [c.clave, '']))
  )
  const [visibles, setVisibles] = useState<Record<string, boolean>>({})
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  function setValue(clave: string, valor: string) {
    setValores(prev => ({ ...prev, [clave]: valor }))
  }

  function toggleVisible(clave: string) {
    setVisibles(prev => ({ ...prev, [clave]: !prev[clave] }))
  }

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault()
    const faltantes = campos.filter(c => !valores[c.clave]?.trim())
    if (faltantes.length > 0) {
      setError(`Faltan campos: ${faltantes.map(f => f.label).join(', ')}`)
      return
    }
    setGuardando(true)
    setError('')
    const ok = await onGuardar(tipo, valores)
    setGuardando(false)
    if (!ok) setError('No se pudo guardar la integración. Verificá las credenciales.')
  }

  if (campos.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="text-4xl mb-3">🚧</div>
          <h2 className="font-semibold text-gray-900 mb-2">Próximamente</h2>
          <p className="text-sm text-gray-500 mb-4">La integración con {nombreIntegracion} estará disponible pronto.</p>
          <button onClick={onCerrar} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm">Cerrar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Conectar {nombreIntegracion}</h2>
          <button onClick={onCerrar} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={manejarEnvio} className="p-6 space-y-4">
          {/* Aviso de seguridad */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
            <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Las credenciales se guardan cifradas con AES-256. Nunca se exponen al navegador.
            </p>
          </div>

          {/* Campos */}
          {campos.map(campo => (
            <div key={campo.clave}>
              <label className="text-sm font-medium text-gray-700 block mb-1">{campo.label}</label>
              <div className="relative">
                <input
                  type={campo.tipo === 'password' && !visibles[campo.clave] ? 'password' : 'text'}
                  value={valores[campo.clave]}
                  onChange={e => setValue(campo.clave, e.target.value)}
                  placeholder={campo.placeholder}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 pr-9"
                />
                {campo.tipo === 'password' && (
                  <button
                    type="button"
                    onClick={() => toggleVisible(campo.clave)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {visibles[campo.clave] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
              {campo.ayuda && (
                <p className="text-xs text-gray-400 mt-1">{campo.ayuda}</p>
              )}
            </div>
          ))}

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCerrar}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
              {guardando ? 'Guardando...' : 'Conectar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
