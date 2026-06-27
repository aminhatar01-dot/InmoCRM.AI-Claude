-- ============================================================
-- Migración 007: Funciones SQL para analíticas
-- ============================================================

-- Contactos nuevos por día
CREATE OR REPLACE FUNCTION analitica_contactos_por_dia(
  p_tenant_id UUID,
  p_desde TIMESTAMPTZ
)
RETURNS TABLE(dia DATE, total BIGINT)
LANGUAGE sql
STABLE
AS $$
  SELECT
    DATE_TRUNC('day', creado_en)::DATE AS dia,
    COUNT(*) AS total
  FROM contactos
  WHERE tenant_id = p_tenant_id
    AND creado_en >= p_desde
  GROUP BY DATE_TRUNC('day', creado_en)
  ORDER BY dia;
$$;

-- Conversaciones iniciadas por día
CREATE OR REPLACE FUNCTION analitica_conversaciones_por_dia(
  p_tenant_id UUID,
  p_desde TIMESTAMPTZ
)
RETURNS TABLE(dia DATE, total BIGINT, bot BIGINT, humano BIGINT)
LANGUAGE sql
STABLE
AS $$
  SELECT
    DATE_TRUNC('day', creado_en)::DATE AS dia,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE estado = 'BOT') AS bot,
    COUNT(*) FILTER (WHERE estado = 'HUMANO') AS humano
  FROM conversaciones
  WHERE tenant_id = p_tenant_id
    AND creado_en >= p_desde
  GROUP BY DATE_TRUNC('day', creado_en)
  ORDER BY dia;
$$;

-- Resumen de rendimiento del agente IA (últimos N días)
CREATE OR REPLACE FUNCTION resumen_agente_ia(
  p_tenant_id UUID,
  p_dias INTEGER DEFAULT 30
)
RETURNS TABLE(
  total_mensajes_bot BIGINT,
  total_mensajes_usuario BIGINT,
  conversaciones_resueltas_bot BIGINT,
  conversaciones_escaladas BIGINT,
  tokens_consumidos BIGINT,
  tasa_resolucion NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  WITH stats AS (
    SELECT
      COUNT(*) FILTER (WHERE m.rol = 'BOT') AS mensajes_bot,
      COUNT(*) FILTER (WHERE m.rol = 'USUARIO') AS mensajes_usuario
    FROM mensajes m
    JOIN conversaciones c ON c.id = m.conversacion_id
    WHERE c.tenant_id = p_tenant_id
      AND m.timestamp >= NOW() - (p_dias || ' days')::INTERVAL
  ),
  convs AS (
    SELECT
      COUNT(*) FILTER (WHERE estado IN ('CERRADO', 'BOT')) AS resueltas_bot,
      COUNT(*) FILTER (WHERE estado = 'HUMANO') AS escaladas
    FROM conversaciones
    WHERE tenant_id = p_tenant_id
      AND creado_en >= NOW() - (p_dias || ' days')::INTERVAL
  ),
  tokens AS (
    SELECT COALESCE(SUM(cantidad), 0) AS total
    FROM uso_tokens
    WHERE tenant_id = p_tenant_id
      AND timestamp >= NOW() - (p_dias || ' days')::INTERVAL
  )
  SELECT
    s.mensajes_bot,
    s.mensajes_usuario,
    c.resueltas_bot,
    c.escaladas,
    t.total AS tokens_consumidos,
    CASE WHEN (c.resueltas_bot + c.escaladas) > 0
      THEN ROUND(c.resueltas_bot::NUMERIC / (c.resueltas_bot + c.escaladas) * 100, 1)
      ELSE 0
    END AS tasa_resolucion
  FROM stats s, convs c, tokens t;
$$;
