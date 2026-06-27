-- ============================================================
-- Migración 003: Configurar pg_cron para seguimientos automáticos
-- Ejecutar como superusuario en Supabase
-- ============================================================

-- Programar ejecución del motor de seguimientos cada hora
SELECT cron.schedule(
  'seguimientos-automaticos',
  '0 * * * *', -- Cada hora en punto
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/seguimientos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Programar recordatorios de visitas (24h antes)
SELECT cron.schedule(
  'recordatorios-visitas',
  '0 9 * * *', -- Todos los días a las 9am
  $$
  INSERT INTO recordatorios (tenant_id, contacto_id, programado_en, mensaje, disparado_por)
  SELECT
    v.tenant_id,
    v.contacto_id,
    NOW(),
    'Hola {nombre}! Te recuerdo que mañana tenés una visita programada. Te esperamos!',
    'IA'
  FROM visitas v
  WHERE v.estado = 'PROGRAMADA'
    AND v.programada_en BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours'
    AND NOT EXISTS (
      SELECT 1 FROM recordatorios r
      WHERE r.contacto_id = v.contacto_id
        AND r.disparado_por = 'IA'
        AND r.timestamp > NOW() - INTERVAL '24 hours'
    );
  $$
);
