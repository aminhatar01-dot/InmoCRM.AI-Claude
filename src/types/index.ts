// ============================================================
// Tipos TypeScript de InmoCRM.AI
// ============================================================

export type Plan = 'basico' | 'pro' | 'enterprise'
export type RolUsuario = 'PROPIETARIO' | 'AGENTE' | 'ADMIN'
export type EstadoConversacion = 'ABIERTO' | 'CERRADO' | 'BOT' | 'HUMANO'
export type RolMensaje = 'USUARIO' | 'BOT' | 'AGENTE'
export type TipoMensaje = 'TEXTO' | 'IMAGEN' | 'AUDIO' | 'DOCUMENTO'
export type CanalOrigen = 'whatsapp' | 'instagram' | 'facebook' | 'web' | 'mercadolibre' | 'manual'
export type EstadoVisita = 'PROGRAMADA' | 'CONFIRMADA' | 'REALIZADA' | 'NO_ASISTIO'
export type EstadoRecordatorio = 'PENDIENTE' | 'ENVIADO' | 'RESPONDIDO' | 'DETENIDO'
export type DisparadoPor = 'IA' | 'MANUAL'
export type TipoIntegracion = 'whatsapp' | 'instagram' | 'facebook' | 'tokko' | 'google_calendar' | 'stripe' | 'mercadopago' | 'hubspot' | 'zoho'

export interface Tenant {
  id: string
  nombre: string
  slug: string
  plan: Plan
  saldo_tokens_ia: number
  configuracion: ConfiguracionTenant
  creado_en: string
}

export interface ConfiguracionTenant {
  nombre_agente?: string
  personalidad_agente?: string
  tono?: 'formal' | 'amigable'
  horario_respuesta?: 'comercial' | '24x7'
  zona_horaria?: string
  pais?: string
  logo_url?: string
  umbral_recarga_tokens?: number
}

export interface Perfil {
  id: string
  tenant_id: string
  user_id: string
  nombre: string
  email: string
  rol: RolUsuario
  activo: boolean
}

export interface Contacto {
  id: string
  tenant_id: string
  nombre: string
  telefono?: string
  email?: string
  canal_origen: CanalOrigen
  etiquetas_smart: string[]
  variables: Record<string, string>
  etapa: string
  asignado_a?: string
  notas?: string
  creado_en: string
  actualizado_en?: string
}

export interface Conversacion {
  id: string
  tenant_id: string
  contacto_id: string
  canal: CanalOrigen
  estado: EstadoConversacion
  ultimo_mensaje_en: string
  contacto?: Contacto
  ultimo_mensaje?: string
}

export interface Mensaje {
  id: string
  conversacion_id: string
  rol: RolMensaje
  contenido: string
  tipo: TipoMensaje
  timestamp: string
  metadatos?: Record<string, unknown>
}

export interface EtiquetaSmart {
  id: string
  tenant_id: string
  nombre: string
  color: string
  etapa: string
  es_automatica: boolean
  palabras_clave: string[]
}

export interface Propiedad {
  id: string
  tenant_id: string
  id_externo?: string
  titulo: string
  tipo: 'departamento' | 'casa' | 'ph' | 'local' | 'oficina' | 'terreno' | 'cochera' | 'galpon'
  operacion: 'venta' | 'alquiler' | 'alquiler_temporario'
  precio?: number
  moneda?: string
  zona?: string
  direccion?: string
  dormitorios?: number
  banios?: number
  superficie_total?: number
  descripcion?: string
  fotos?: string[]
  estado: 'disponible' | 'reservada' | 'vendida' | 'alquilada'
  fuente_externa?: string
  url_externa?: string
  embedding?: number[]
  creado_en: string
  actualizado_en?: string
}

export interface Visita {
  id: string
  tenant_id: string
  contacto_id: string
  propiedad_id: string
  programada_en: string
  estado: EstadoVisita
  agente_id?: string
  id_evento_calendario?: string
}

export interface Campana {
  id: string
  tenant_id: string
  nombre: string
  mensaje: string
  estado: 'BORRADOR' | 'EN_PROCESO' | 'ENVIADA' | 'PAUSADA'
  segmento?: { etapas?: string[]; etiquetas?: string[]; canales?: string[] }
  total_enviados: number
  total_respondidos: number
  programada_en?: string
  creado_en: string
}

export interface Recordatorio {
  id: string
  tenant_id: string
  contacto_id: string
  programado_en: string
  mensaje: string
  estado: EstadoRecordatorio
  disparado_por: DisparadoPor
}

export interface Integracion {
  id: string
  tenant_id: string
  tipo: TipoIntegracion
  activa: boolean
  ultima_sincronizacion?: string
}

export interface Suscripcion {
  id: string
  tenant_id: string
  stripe_subscription_id?: string
  plan: Plan
  estado: 'activa' | 'cancelada' | 'vencida'
  periodo_actual_fin: string
}

export interface UsoTokens {
  id: string
  tenant_id: string
  cantidad: number
  tipo: string
  timestamp: string
}

// Tipos de UI
export interface FiltrosBandeja {
  canal?: CanalOrigen
  etiqueta?: string
  etapa?: string
  agente?: string
  busqueda?: string
}

export interface EtapaEmbudo {
  id: string
  nombre: string
  color: string
  orden: number
}

export const ETAPAS_EMBUDO: EtapaEmbudo[] = [
  { id: 'nuevo', nombre: 'Nuevo', color: '#6C47FF', orden: 0 },
  { id: 'interesado', nombre: 'Interesado', color: '#10B981', orden: 1 },
  { id: 'visita_agendada', nombre: 'Visita agendada', color: '#F59E0B', orden: 2 },
  { id: 'propuesta_enviada', nombre: 'Propuesta enviada', color: '#3B82F6', orden: 3 },
  { id: 'cerrado', nombre: 'Cerrado', color: '#10B981', orden: 4 },
  { id: 'perdido', nombre: 'Perdido', color: '#EF4444', orden: 5 },
]
