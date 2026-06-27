-- ============================================================
-- Migración 005: Tablas y triggers para automatizaciones
-- ============================================================

-- Tabla de secuencias de follow-up (plantillas de automatización)
CREATE TABLE IF NOT EXISTS secuencias_followup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  activa BOOLEAN DEFAULT true,
  etapa_activadora TEXT NOT NULL, -- etapa del contacto que activa la secuencia
  pasos JSONB NOT NULL DEFAULT '[]', -- [{dias: 1, mensaje: "...", tipo: "whatsapp"}]
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE secuencias_followup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_aislado_secuencias" ON secuencias_followup
  USING (tenant_id = obtener_tenant_id_usuario());

-- Tabla de ejecuciones de secuencias (rastreo de contactos en follow-up)
CREATE TABLE IF NOT EXISTS ejecuciones_followup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  secuencia_id UUID NOT NULL REFERENCES secuencias_followup(id) ON DELETE CASCADE,
  contacto_id UUID NOT NULL REFERENCES contactos(id) ON DELETE CASCADE,
  paso_actual INTEGER DEFAULT 0,
  proximo_paso_en TIMESTAMPTZ NOT NULL,
  estado TEXT DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'PAUSADA', 'COMPLETADA', 'CANCELADA')),
  iniciada_en TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(secuencia_id, contacto_id)
);

ALTER TABLE ejecuciones_followup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_aislado_ejecuciones" ON ejecuciones_followup
  USING (tenant_id = obtener_tenant_id_usuario());

-- Tabla de plantillas de mensajes
CREATE TABLE IF NOT EXISTS plantillas_mensajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  contenido TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}', -- variables que acepta: {nombre}, {zona}, etc.
  categoria TEXT DEFAULT 'general',
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE plantillas_mensajes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_aislado_plantillas" ON plantillas_mensajes
  USING (tenant_id = obtener_tenant_id_usuario());

-- Tabla de notificaciones internas
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'nuevo_lead', 'escalacion', 'visita_prox', 'tokens_bajos', 'campana_completada'
  titulo TEXT NOT NULL,
  cuerpo TEXT,
  leida BOOLEAN DEFAULT false,
  datos JSONB DEFAULT '{}',
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuario_propias_notificaciones" ON notificaciones
  USING (user_id = auth.uid() OR tenant_id = obtener_tenant_id_usuario());

-- Exponer notificaciones en Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notificaciones;

-- Índices
CREATE INDEX IF NOT EXISTS idx_ejecuciones_followup_proximo
  ON ejecuciones_followup(tenant_id, proximo_paso_en) WHERE estado = 'ACTIVA';

CREATE INDEX IF NOT EXISTS idx_notificaciones_user_leida
  ON notificaciones(user_id, leida, creado_en DESC);

-- Trigger: al crear contacto en estado 'nuevo', buscar secuencias activas
CREATE OR REPLACE FUNCTION iniciar_secuencias_para_contacto()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_secuencia RECORD;
BEGIN
  FOR v_secuencia IN
    SELECT id FROM secuencias_followup
    WHERE tenant_id = NEW.tenant_id
      AND etapa_activadora = NEW.etapa
      AND activa = true
  LOOP
    INSERT INTO ejecuciones_followup (tenant_id, secuencia_id, contacto_id, paso_actual, proximo_paso_en)
    VALUES (NEW.tenant_id, v_secuencia.id, NEW.id, 0, NOW() + INTERVAL '1 hour')
    ON CONFLICT (secuencia_id, contacto_id) DO NOTHING;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trigger_iniciar_secuencias
  AFTER INSERT ON contactos
  FOR EACH ROW EXECUTE FUNCTION iniciar_secuencias_para_contacto();

-- Trigger: notificación al detectar escalación a humano
CREATE OR REPLACE FUNCTION notificar_escalacion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.estado = 'HUMANO' AND OLD.estado = 'BOT' THEN
    INSERT INTO notificaciones (tenant_id, tipo, titulo, cuerpo, datos)
    VALUES (
      NEW.tenant_id,
      'escalacion',
      'Lead requiere atención humana',
      'Una conversación fue escalada a agente humano.',
      jsonb_build_object('conversacion_id', NEW.id, 'contacto_id', NEW.contacto_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trigger_notificar_escalacion
  AFTER UPDATE OF estado ON conversaciones
  FOR EACH ROW EXECUTE FUNCTION notificar_escalacion();

-- pg_cron: ejecutar follow-ups pendientes cada 30 minutos
SELECT cron.schedule(
  'motor-followup',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/motor-followup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
