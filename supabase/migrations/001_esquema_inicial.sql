-- ============================================================
-- InmoCRM.AI — Migración inicial
-- Esquema completo con RLS para aislamiento multi-tenant
-- ============================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ────────────────────────────────────────────────────────────
-- TABLA: tenants
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'basico' CHECK (plan IN ('basico', 'pro', 'enterprise')),
  saldo_tokens_ia INTEGER NOT NULL DEFAULT 10000,
  configuracion JSONB NOT NULL DEFAULT '{}',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- TABLA: perfiles
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS perfiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'AGENTE' CHECK (rol IN ('PROPIETARIO', 'AGENTE', 'ADMIN')),
  activo BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(tenant_id, user_id)
);

-- ────────────────────────────────────────────────────────────
-- TABLA: contactos
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contactos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  canal_origen TEXT NOT NULL DEFAULT 'manual' CHECK (canal_origen IN ('whatsapp','instagram','facebook','web','mercadolibre','manual')),
  etiquetas_smart TEXT[] NOT NULL DEFAULT '{}',
  variables JSONB NOT NULL DEFAULT '{}',
  etapa TEXT NOT NULL DEFAULT 'nuevo',
  asignado_a UUID REFERENCES perfiles(id),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- TABLA: conversaciones
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contacto_id UUID NOT NULL REFERENCES contactos(id) ON DELETE CASCADE,
  canal TEXT NOT NULL CHECK (canal IN ('whatsapp','instagram','facebook','web','mercadolibre','manual')),
  estado TEXT NOT NULL DEFAULT 'BOT' CHECK (estado IN ('ABIERTO','CERRADO','BOT','HUMANO')),
  ultimo_mensaje_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- TABLA: mensajes
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mensajes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversacion_id UUID NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,
  rol TEXT NOT NULL CHECK (rol IN ('USUARIO','BOT','AGENTE')),
  contenido TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'TEXTO' CHECK (tipo IN ('TEXTO','IMAGEN','AUDIO','DOCUMENTO')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadatos JSONB
);

-- ────────────────────────────────────────────────────────────
-- TABLA: etiquetas_smart
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS etiquetas_smart (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6C47FF',
  etapa TEXT NOT NULL DEFAULT 'nuevo',
  es_automatica BOOLEAN NOT NULL DEFAULT false,
  palabras_clave TEXT[] NOT NULL DEFAULT '{}'
);

-- ────────────────────────────────────────────────────────────
-- TABLA: propiedades
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS propiedades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  id_externo TEXT,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('venta','alquiler')),
  precio NUMERIC NOT NULL,
  zona TEXT NOT NULL,
  dormitorios INTEGER,
  banos INTEGER,
  descripcion TEXT,
  url_brochure TEXT,
  embedding vector(1536),
  activa BOOLEAN NOT NULL DEFAULT true
);

-- ────────────────────────────────────────────────────────────
-- TABLA: visitas
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visitas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contacto_id UUID NOT NULL REFERENCES contactos(id) ON DELETE CASCADE,
  propiedad_id UUID NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  programada_en TIMESTAMPTZ NOT NULL,
  estado TEXT NOT NULL DEFAULT 'PROGRAMADA' CHECK (estado IN ('PROGRAMADA','CONFIRMADA','REALIZADA','NO_ASISTIO')),
  agente_id UUID REFERENCES perfiles(id),
  id_evento_calendario TEXT
);

-- ────────────────────────────────────────────────────────────
-- TABLA: campanas
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campanas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  canal TEXT NOT NULL,
  segmento_objetivo JSONB NOT NULL DEFAULT '{}',
  mensaje TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','programada','enviando','completada')),
  cant_enviados INTEGER NOT NULL DEFAULT 0,
  cant_entregados INTEGER NOT NULL DEFAULT 0,
  cant_respuestas INTEGER NOT NULL DEFAULT 0,
  programada_en TIMESTAMPTZ
);

-- ────────────────────────────────────────────────────────────
-- TABLA: recordatorios
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recordatorios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contacto_id UUID NOT NULL REFERENCES contactos(id) ON DELETE CASCADE,
  programado_en TIMESTAMPTZ NOT NULL,
  mensaje TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','ENVIADO','RESPONDIDO','DETENIDO')),
  disparado_por TEXT NOT NULL DEFAULT 'MANUAL' CHECK (disparado_por IN ('IA','MANUAL'))
);

-- ────────────────────────────────────────────────────────────
-- TABLA: integraciones
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integraciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  credenciales JSONB NOT NULL DEFAULT '{}',
  activa BOOLEAN NOT NULL DEFAULT false,
  ultima_sincronizacion TIMESTAMPTZ,
  UNIQUE(tenant_id, tipo)
);

-- ────────────────────────────────────────────────────────────
-- TABLA: suscripciones
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suscripciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'basico' CHECK (plan IN ('basico','pro','enterprise')),
  estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','cancelada','vencida')),
  periodo_actual_fin TIMESTAMPTZ NOT NULL
);

-- ────────────────────────────────────────────────────────────
-- TABLA: uso_tokens
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS uso_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- ÍNDICES para performance
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_perfiles_tenant ON perfiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_perfiles_user ON perfiles(user_id);
CREATE INDEX IF NOT EXISTS idx_contactos_tenant ON contactos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contactos_etapa ON contactos(tenant_id, etapa);
CREATE INDEX IF NOT EXISTS idx_conversaciones_tenant ON conversaciones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversaciones_contacto ON conversaciones(contacto_id);
CREATE INDEX IF NOT EXISTS idx_conversaciones_estado ON conversaciones(tenant_id, estado);
CREATE INDEX IF NOT EXISTS idx_mensajes_conversacion ON mensajes(conversacion_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_timestamp ON mensajes(conversacion_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_propiedades_tenant ON propiedades(tenant_id);
CREATE INDEX IF NOT EXISTS idx_propiedades_zona ON propiedades(tenant_id, zona);
CREATE INDEX IF NOT EXISTS idx_visitas_tenant ON visitas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recordatorios_tenant ON recordatorios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recordatorios_fecha ON recordatorios(tenant_id, programado_en);
CREATE INDEX IF NOT EXISTS idx_uso_tokens_tenant ON uso_tokens(tenant_id);

-- Índice vectorial para búsqueda semántica de propiedades
CREATE INDEX IF NOT EXISTS idx_propiedades_embedding ON propiedades
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ────────────────────────────────────────────────────────────
-- HABILITAR ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE etiquetas_smart ENABLE ROW LEVEL SECURITY;
ALTER TABLE propiedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanas ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordatorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE integraciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE uso_tokens ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- FUNCIÓN: obtener tenant_id del usuario autenticado
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION obtener_tenant_id_usuario()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT tenant_id FROM perfiles
  WHERE user_id = auth.uid() AND activo = true
  LIMIT 1;
$$;

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS RLS — tenants
-- ────────────────────────────────────────────────────────────
CREATE POLICY "usuarios_ven_su_tenant" ON tenants
  FOR SELECT USING (id = obtener_tenant_id_usuario());

CREATE POLICY "propietarios_actualizan_tenant" ON tenants
  FOR UPDATE USING (
    id = obtener_tenant_id_usuario()
    AND EXISTS (
      SELECT 1 FROM perfiles
      WHERE user_id = auth.uid() AND rol IN ('PROPIETARIO','ADMIN') AND activo = true
    )
  );

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS RLS — perfiles
-- ────────────────────────────────────────────────────────────
CREATE POLICY "usuarios_ven_perfiles_tenant" ON perfiles
  FOR SELECT USING (tenant_id = obtener_tenant_id_usuario());

CREATE POLICY "admin_gestiona_perfiles" ON perfiles
  FOR ALL USING (
    tenant_id = obtener_tenant_id_usuario()
    AND EXISTS (
      SELECT 1 FROM perfiles p2
      WHERE p2.user_id = auth.uid() AND p2.rol IN ('PROPIETARIO','ADMIN') AND p2.activo = true
    )
  );

CREATE POLICY "usuario_ve_su_perfil" ON perfiles
  FOR SELECT USING (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS RLS — contactos
-- ────────────────────────────────────────────────────────────
CREATE POLICY "aislamiento_contactos" ON contactos
  FOR ALL USING (tenant_id = obtener_tenant_id_usuario());

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS RLS — conversaciones
-- ────────────────────────────────────────────────────────────
CREATE POLICY "aislamiento_conversaciones" ON conversaciones
  FOR ALL USING (tenant_id = obtener_tenant_id_usuario());

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS RLS — mensajes (via conversacion del tenant)
-- ────────────────────────────────────────────────────────────
CREATE POLICY "aislamiento_mensajes" ON mensajes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM conversaciones c
      WHERE c.id = mensajes.conversacion_id
        AND c.tenant_id = obtener_tenant_id_usuario()
    )
  );

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS RLS — etiquetas_smart
-- ────────────────────────────────────────────────────────────
CREATE POLICY "aislamiento_etiquetas" ON etiquetas_smart
  FOR ALL USING (tenant_id = obtener_tenant_id_usuario());

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS RLS — propiedades
-- ────────────────────────────────────────────────────────────
CREATE POLICY "aislamiento_propiedades" ON propiedades
  FOR ALL USING (tenant_id = obtener_tenant_id_usuario());

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS RLS — visitas
-- ────────────────────────────────────────────────────────────
CREATE POLICY "aislamiento_visitas" ON visitas
  FOR ALL USING (tenant_id = obtener_tenant_id_usuario());

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS RLS — campanas
-- ────────────────────────────────────────────────────────────
CREATE POLICY "aislamiento_campanas" ON campanas
  FOR ALL USING (tenant_id = obtener_tenant_id_usuario());

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS RLS — recordatorios
-- ────────────────────────────────────────────────────────────
CREATE POLICY "aislamiento_recordatorios" ON recordatorios
  FOR ALL USING (tenant_id = obtener_tenant_id_usuario());

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS RLS — integraciones
-- ────────────────────────────────────────────────────────────
CREATE POLICY "aislamiento_integraciones" ON integraciones
  FOR ALL USING (tenant_id = obtener_tenant_id_usuario());

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS RLS — suscripciones
-- ────────────────────────────────────────────────────────────
CREATE POLICY "aislamiento_suscripciones" ON suscripciones
  FOR ALL USING (tenant_id = obtener_tenant_id_usuario());

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS RLS — uso_tokens
-- ────────────────────────────────────────────────────────────
CREATE POLICY "aislamiento_uso_tokens" ON uso_tokens
  FOR ALL USING (tenant_id = obtener_tenant_id_usuario());

-- ────────────────────────────────────────────────────────────
-- FUNCIÓN: buscar propiedades por similitud semántica
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION buscar_propiedades_similares(
  consulta_embedding vector(1536),
  tenant_uuid UUID,
  limite INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  titulo TEXT,
  tipo TEXT,
  precio NUMERIC,
  zona TEXT,
  dormitorios INTEGER,
  descripcion TEXT,
  similitud FLOAT
)
LANGUAGE sql
AS $$
  SELECT
    p.id,
    p.titulo,
    p.tipo,
    p.precio,
    p.zona,
    p.dormitorios,
    p.descripcion,
    1 - (p.embedding <=> consulta_embedding) AS similitud
  FROM propiedades p
  WHERE p.tenant_id = tenant_uuid AND p.activa = true
  ORDER BY p.embedding <=> consulta_embedding
  LIMIT limite;
$$;

-- ────────────────────────────────────────────────────────────
-- TRIGGER: actualizar ultimo_mensaje_en en conversacion
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION actualizar_ultimo_mensaje()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE conversaciones
  SET ultimo_mensaje_en = NEW.timestamp
  WHERE id = NEW.conversacion_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_ultimo_mensaje
  AFTER INSERT ON mensajes
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_ultimo_mensaje();

-- ────────────────────────────────────────────────────────────
-- Habilitar Realtime para bandeja omnicanal
-- ────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE mensajes;
ALTER PUBLICATION supabase_realtime ADD TABLE conversaciones;
ALTER PUBLICATION supabase_realtime ADD TABLE contactos;
