-- ============================================================
-- Migración 006: Stripe billing y suscripciones
-- ============================================================

-- Columnas para Stripe en tenants
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS suscripcion_activa BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS fecha_vencimiento TIMESTAMPTZ;

-- Tabla de historial de pagos
CREATE TABLE IF NOT EXISTS pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_payment_id TEXT UNIQUE,
  monto INTEGER NOT NULL, -- en centavos
  moneda TEXT DEFAULT 'usd',
  concepto TEXT NOT NULL, -- 'suscripcion' | 'tokens'
  tokens_agregados INTEGER DEFAULT 0,
  estado TEXT DEFAULT 'completado',
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_aislado_pagos" ON pagos
  USING (tenant_id = obtener_tenant_id_usuario());

-- Tabla de planes de tokens (para recargas de tokens)
CREATE TABLE IF NOT EXISTS paquetes_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tokens INTEGER NOT NULL,
  precio_usd NUMERIC(10,2) NOT NULL,
  stripe_price_id TEXT,
  destacado BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true
);

-- Insertar paquetes de tokens predefinidos
INSERT INTO paquetes_tokens (nombre, tokens, precio_usd, destacado) VALUES
  ('Starter', 50000, 9.99, false),
  ('Pro', 150000, 24.99, true),
  ('Enterprise', 500000, 69.99, false)
ON CONFLICT DO NOTHING;

-- Función para agregar tokens atómicamente
CREATE OR REPLACE FUNCTION agregar_tokens(
  p_tenant_id UUID,
  p_cantidad INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE tenants
  SET saldo_tokens_ia = saldo_tokens_ia + p_cantidad
  WHERE id = p_tenant_id;
END;
$$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_pagos_tenant ON pagos(tenant_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_tenants_stripe ON tenants(stripe_customer_id);
