-- ============================================================
-- Migración 004: Índices adicionales para CRM
-- ============================================================

-- Índices en contactos para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_contactos_tenant_etapa
  ON contactos(tenant_id, etapa);

CREATE INDEX IF NOT EXISTS idx_contactos_tenant_canal
  ON contactos(tenant_id, canal_origen);

CREATE INDEX IF NOT EXISTS idx_contactos_etiquetas
  ON contactos USING GIN(etiquetas_smart);

CREATE INDEX IF NOT EXISTS idx_contactos_nombre_trgm
  ON contactos USING GIN(nombre gin_trgm_ops);

-- Índices en propiedades
CREATE INDEX IF NOT EXISTS idx_propiedades_tenant_tipo
  ON propiedades(tenant_id, tipo, operacion);

CREATE INDEX IF NOT EXISTS idx_propiedades_tenant_estado
  ON propiedades(tenant_id, estado);

CREATE INDEX IF NOT EXISTS idx_propiedades_precio
  ON propiedades(tenant_id, precio);

-- Índices en visitas
CREATE INDEX IF NOT EXISTS idx_visitas_tenant_fecha
  ON visitas(tenant_id, programada_en);

CREATE INDEX IF NOT EXISTS idx_visitas_contacto
  ON visitas(contacto_id);

CREATE INDEX IF NOT EXISTS idx_visitas_propiedad
  ON visitas(propiedad_id);

-- Extensión para búsqueda trigram (necesaria para búsqueda por nombre)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Vista para estadísticas del embudo por tenant
CREATE OR REPLACE VIEW estadisticas_embudo AS
SELECT
  tenant_id,
  etapa,
  COUNT(*) AS total,
  COUNT(CASE WHEN canal_origen = 'whatsapp' THEN 1 END) AS via_whatsapp,
  AVG(EXTRACT(EPOCH FROM (NOW() - creado_en)) / 86400)::INTEGER AS antiguedad_promedio_dias
FROM contactos
GROUP BY tenant_id, etapa;
