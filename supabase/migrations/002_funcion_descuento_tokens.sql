-- ============================================================
-- Migración 002: Función para descuento atómico de tokens
-- ============================================================

-- Función para descontar tokens de forma atómica (evita race conditions)
CREATE OR REPLACE FUNCTION descontar_tokens(
  p_tenant_id UUID,
  p_cantidad INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE tenants
  SET saldo_tokens_ia = GREATEST(0, saldo_tokens_ia - p_cantidad)
  WHERE id = p_tenant_id;
END;
$$;

-- Función para obtener el saldo de tokens de un tenant
CREATE OR REPLACE FUNCTION obtener_saldo_tokens(p_tenant_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT saldo_tokens_ia FROM tenants WHERE id = p_tenant_id;
$$;

-- Vista de uso de tokens por tenant (últimos 30 días)
CREATE OR REPLACE VIEW resumen_tokens_30d AS
SELECT
  tenant_id,
  SUM(cantidad) AS total_30d,
  COUNT(*) AS llamadas_30d,
  DATE_TRUNC('day', timestamp) AS dia
FROM uso_tokens
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY tenant_id, DATE_TRUNC('day', timestamp)
ORDER BY dia DESC;
