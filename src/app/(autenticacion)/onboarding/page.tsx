'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Building2, Wifi, Brain, Tags, CheckCircle2, ArrowRight, ArrowLeft, Upload, QrCode, Key } from 'lucide-react'
import { crearClienteNavegador } from '@/lib/supabase/cliente'
import { cn } from '@/lib/utilidades'

interface DatosOnboarding {
  nombreAgencia: string
  zonaHoraria: string
  pais: string
  canalElegido: string
  nombreAgente: string
  personalidad: string
  tono: string
  horario: string
  etiquetasSeleccionadas: string[]
}

const PASOS = [
  { numero: 1, titulo: 'Tu agencia', icono: Building2 },
  { numero: 2, titulo: 'Primer canal', icono: Wifi },
  { numero: 3, titulo: 'Agente IA', icono: Brain },
  { numero: 4, titulo: 'Etiquetas', icono: Tags },
  { numero: 5, titulo: 'Listo', icono: CheckCircle2 },
]

const ETIQUETAS_SUGERIDAS = [
  { nombre: 'Caliente', desc: 'Lead con alta intencion de compra', palabras: ['urgente', 'quiero comprar'] },
  { nombre: 'Inversor', desc: 'Busca propiedades como inversion', palabras: ['inversion', 'renta'] },
  { nombre: 'Familia', desc: 'Busca vivienda familiar', palabras: ['familia', 'hijos'] },
  { nombre: 'Credito', desc: 'Necesita financiamiento', palabras: ['credito', 'hipoteca'] },
  { nombre: 'Primera vez', desc: 'Primer comprador', palabras: ['primera vez'] },
  { nombre: 'Alto valor', desc: 'Presupuesto premium', palabras: ['millones', 'premium'] },
]

export default function PaginaOnboarding() {
  const router = useRouter()
  const supabase = crearClienteNavegador()
  const [pasoActual, setPasoActual] = useState(1)
  const [guardando, setGuardando] = useState(false)

  const [datos, setDatos] = useState<DatosOnboarding>({
    nombreAgencia: '',
    zonaHoraria: 'America/Argentina/Buenos_Aires',
    pais: 'Argentina',
    canalElegido: 'omitir',
    nombreAgente: 'Sofia',
    personalidad: 'Soy un asistente de ventas inmobiliarias. Ayudo a los clientes a encontrar la propiedad ideal.',
    tono: 'amigable',
    horario: '24x7',
    etiquetasSeleccionadas: ['Caliente', 'Inversor', 'Familia'],
  })

  const actualizar = useCallback(<K extends keyof DatosOnboarding>(clave: K, valor: DatosOnboarding[K]) => {
    setDatos(prev => ({ ...prev, [clave]: valor }))
  }, [])

  function toggleEtiqueta(nombre: string) {
    setDatos(prev => ({
      ...prev,
      etiquetasSeleccionadas: prev.etiquetasSeleccionadas.includes(nombre)
        ? prev.etiquetasSeleccionadas.filter(e => e !== nombre)
        : [...prev.etiquetasSeleccionadas, nombre],
    }))
  }

  async function obtenerTenantId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: perfil } = await supabase
      .from('perfiles').select('tenant_id').eq('user_id', user.id).single()
    return perfil?.tenant_id ?? null
  }

  async function guardarConfiguracion() {
    const tenantId = await obtenerTenantId()
    if (!tenantId) return
    const actualizacion: Record<string, unknown> = {
      configuracion: {
        pais: datos.pais,
        zona_horaria: datos.zonaHoraria,
        nombre_agente: datos.nombreAgente,
        personalidad_agente: datos.personalidad,
        tono: datos.tono,
        horario_respuesta: datos.horario,
      },
    }
    if (datos.nombreAgencia) actualizacion.nombre = datos.nombreAgencia
    await supabase.from('tenants').update(actualizacion).eq('id', tenantId)
  }

  async function guardarEtiquetas() {
    const tenantId = await obtenerTenantId()
    if (!tenantId) return
    const filas = ETIQUETAS_SUGERIDAS
      .filter(e => datos.etiquetasSeleccionadas.includes(e.nombre))
      .map(e => ({
        tenant_id: tenantId,
        nombre: e.nombre,
        color: '#6C47FF',
        etapa: 'nuevo',
        es_automatica: true,
        palabras_clave: e.palabras,
      }))
    if (filas.length > 0) await supabase.from('etiquetas_smart').insert(filas)
  }

  async function avanzar() {
    setGuardando(true)
    try {
      if (pasoActual === 4) {
        await guardarConfiguracion()
        await guardarEtiquetas()
        setPasoActual(5)
      } else {
        if (pasoActual === 1 || pasoActual === 3) await guardarConfiguracion()
        setPasoActual(p => p + 1)
      }
    } finally {
      setGuardando(false)
    }
  }

  const porcentaje = ((pasoActual - 1) / 4) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-emerald-50">
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Bot size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900">InmoCRM<span className="text-violet-600">.AI</span></span>
          <span className="text-sm text-gray-500 ml-2">Configuracion inicial</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {PASOS.map(({ numero, titulo, icono: Icono }) => (
              <div key={numero} className="flex flex-col items-center gap-1">
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all',
                  numero < pasoActual ? 'bg-violet-600 border-violet-600' :
                  numero === pasoActual ? 'border-violet-600 bg-violet-50' : 'border-gray-200 bg-white'
                )}>
                  {numero < pasoActual
                    ? <CheckCircle2 size={16} className="text-white" />
                    : <Icono size={15} className={numero === pasoActual ? 'text-violet-600' : 'text-gray-400'} />
                  }
                </div>
                <span className={cn('text-xs font-medium hidden sm:block',
                  numero === pasoActual ? 'text-violet-600' : numero < pasoActual ? 'text-gray-600' : 'text-gray-400'
                )}>{titulo}</span>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-violet-600 rounded-full transition-all duration-500" style={{ width: `${porcentaje}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 min-h-96 flex flex-col">
          {pasoActual === 1 && <Paso1Agencia datos={datos} actualizar={actualizar} />}
          {pasoActual === 2 && <Paso2Canal datos={datos} actualizar={actualizar} />}
          {pasoActual === 3 && <Paso3Agente datos={datos} actualizar={actualizar} />}
          {pasoActual === 4 && <Paso4Etiquetas datos={datos} sugeridas={ETIQUETAS_SUGERIDAS} toggle={toggleEtiqueta} />}
          {pasoActual === 5 && <Paso5Listo onTablero={() => router.push('/tablero')} onIntegraciones={() => router.push('/integraciones')} />}

          {pasoActual < 5 && (
            <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-100">
              <button onClick={() => setPasoActual(p => p - 1)} disabled={pasoActual === 1}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed">
                <ArrowLeft size={16} /> Atras
              </button>
              <div className="flex items-center gap-3">
                {pasoActual < 4 && (
                  <button onClick={() => setPasoActual(p => p + 1)} className="text-sm text-gray-400 hover:text-gray-600">Omitir</button>
                )}
                <button onClick={avanzar} disabled={guardando}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
                  {guardando
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <span className="flex items-center gap-2">{pasoActual === 4 ? 'Finalizar' : 'Continuar'} <ArrowRight size={16} /></span>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Paso1Agencia({ datos, actualizar }: { datos: DatosOnboarding; actualizar: <K extends keyof DatosOnboarding>(k: K, v: DatosOnboarding[K]) => void }) {
  return (
    <div className="flex-1">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Datos de tu agencia</h2>
      <p className="text-gray-500 text-sm mb-6">Esta informacion aparecera en tus comunicaciones</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la agencia</label>
          <input type="text" value={datos.nombreAgencia} onChange={e => actualizar('nombreAgencia', e.target.value)}
            placeholder="InmoPalermo S.A."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pais</label>
            <select value={datos.pais} onChange={e => actualizar('pais', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              {['Argentina','Uruguay','Chile','Colombia','Mexico','Espana'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Zona horaria</label>
            <select value={datos.zonaHoraria} onChange={e => actualizar('zonaHoraria', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
              <option value="America/Montevideo">Montevideo (GMT-3)</option>
              <option value="America/Santiago">Santiago (GMT-4)</option>
              <option value="America/Mexico_City">Mexico (GMT-6)</option>
              <option value="Europe/Madrid">Madrid (GMT+1)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Logo (opcional)</label>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-violet-300 transition-colors cursor-pointer">
            <Upload size={24} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Arrastra tu logo o hace clic para subir</p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG hasta 2MB</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Paso2Canal({ datos, actualizar }: { datos: DatosOnboarding; actualizar: <K extends keyof DatosOnboarding>(k: K, v: DatosOnboarding[K]) => void }) {
  const opciones = [
    { id: 'whatsapp_qr', titulo: 'WhatsApp con QR', desc: 'Conecta tu numero escaneando un QR. Rapido y simple.', icono: QrCode, badge: 'Recomendado' },
    { id: 'whatsapp_api', titulo: 'WhatsApp Business API', desc: 'Via Meta Business Manager. Mas volumen y templates.', icono: Key, badge: 'Mayor volumen' },
    { id: 'omitir', titulo: 'Configurar despues', desc: 'Podes conectar desde Integraciones en cualquier momento.', icono: ArrowRight, badge: null },
  ]
  return (
    <div className="flex-1">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Conecta tu primer canal</h2>
      <p className="text-gray-500 text-sm mb-6">Por donde llegaran tus leads al agente IA</p>
      <div className="space-y-3">
        {opciones.map(({ id, titulo, desc, icono: Icono, badge }) => (
          <button key={id} onClick={() => actualizar('canalElegido', id)}
            className={cn('w-full text-left p-4 rounded-xl border-2 transition-all',
              datos.canalElegido === id ? 'border-violet-600 bg-violet-50' : 'border-gray-200 hover:border-gray-300')}>
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                datos.canalElegido === id ? 'bg-violet-600' : 'bg-gray-100')}>
                <Icono size={18} className={datos.canalElegido === id ? 'text-white' : 'text-gray-500'} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 text-sm">{titulo}</span>
                  {badge && <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{badge}</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function Paso3Agente({ datos, actualizar }: { datos: DatosOnboarding; actualizar: <K extends keyof DatosOnboarding>(k: K, v: DatosOnboarding[K]) => void }) {
  return (
    <div className="flex-1">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Configura tu agente IA</h2>
      <p className="text-gray-500 text-sm mb-6">Tu agente respondera leads 24/7 con esta personalidad</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre del agente</label>
          <input type="text" value={datos.nombreAgente} onChange={e => actualizar('nombreAgente', e.target.value)}
            placeholder="Sofia, Lucas, Valeria..." maxLength={30}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripcion y especialidad</label>
          <textarea value={datos.personalidad} onChange={e => actualizar('personalidad', e.target.value)}
            rows={3} placeholder="Soy asistente de ventas inmobiliarias especializado en..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tono</label>
            <div className="flex gap-2">
              {(['amigable', 'formal']).map(id => (
                <button key={id} onClick={() => actualizar('tono', id)}
                  className={cn('flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all capitalize',
                    datos.tono === id ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                  {id}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Horario</label>
            <div className="flex gap-2">
              {(['24x7', 'comercial']).map(id => (
                <button key={id} onClick={() => actualizar('horario', id)}
                  className={cn('flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all',
                    datos.horario === id ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                  {id === '24x7' ? '24/7' : 'Comercial'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Vista previa</p>
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-white rounded-xl rounded-tl-none px-3 py-2 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-800">
                {datos.tono === 'amigable' ? 'Hola! ' : 'Buenos dias. '}
                Soy {datos.nombreAgente}. En que puedo ayudarte?
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Paso4Etiquetas({ datos, sugeridas, toggle }: {
  datos: DatosOnboarding
  sugeridas: typeof ETIQUETAS_SUGERIDAS
  toggle: (nombre: string) => void
}) {
  return (
    <div className="flex-1">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Etiquetas Smart</h2>
      <p className="text-gray-500 text-sm mb-5">La IA aplicara estas etiquetas automaticamente segun las respuestas de tus leads</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {sugeridas.map(({ nombre, desc }) => {
          const activa = datos.etiquetasSeleccionadas.includes(nombre)
          return (
            <button key={nombre} onClick={() => toggle(nombre)}
              className={cn('text-left p-3.5 rounded-xl border-2 transition-all',
                activa ? 'border-violet-600 bg-violet-50' : 'border-gray-200 hover:border-gray-300')}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-gray-900">{nombre}</span>
                <div className={cn('w-4 h-4 rounded border-2',
                  activa ? 'bg-violet-600 border-violet-600' : 'border-gray-300')} />
              </div>
              <p className="text-xs text-gray-500">{desc}</p>
            </button>
          )
        })}
      </div>
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-xs text-blue-700">Podes crear etiquetas personalizadas desde Configuracion en cualquier momento.</p>
      </div>
    </div>
  )
}

function Paso5Listo({ onTablero, onIntegraciones }: { onTablero: () => void; onIntegraciones: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 size={40} className="text-emerald-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Todo configurado!</h2>
      <p className="text-gray-500 mb-6 max-w-sm">Tu agencia esta lista. Conecta tu primer canal y empieza a recibir leads en piloto automatico.</p>
      <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left w-full max-w-sm space-y-1.5">
        {['Agencia configurada','Agente IA listo para entrenar','Etiquetas Smart activadas','Seguridad multi-tenant activa'].map(item => (
          <div key={item} className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
            <span className="text-sm text-gray-600">{item}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <button onClick={onTablero}
          className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
          Ir al tablero <ArrowRight size={16} />
        </button>
        <button onClick={onIntegraciones}
          className="flex-1 border border-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm">
          Conectar WhatsApp
        </button>
      </div>
    </div>
  )
}
