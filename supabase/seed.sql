-- ============================================================
-- InmoCRM.AI — Datos de prueba (seed)
-- Ejecutar SOLO en entornos de desarrollo
-- ============================================================

-- Tenant de prueba
INSERT INTO tenants (id, nombre, slug, plan, saldo_tokens_ia, configuracion)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'InmoPalermo Demo',
  'inmopalermo-demo',
  'pro',
  20000,
  '{"nombre_agente": "Sofía", "tono": "amigable", "pais": "Argentina", "zona_horaria": "America/Argentina/Buenos_Aires"}'
) ON CONFLICT (id) DO NOTHING;

-- Etiquetas smart de prueba
INSERT INTO etiquetas_smart (tenant_id, nombre, color, etapa, es_automatica, palabras_clave)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Caliente', '#EF4444', 'interesado', true, ARRAY['urgente','necesito','quiero comprar','tengo efectivo']),
  ('00000000-0000-0000-0000-000000000001', 'Inversor', '#F59E0B', 'interesado', true, ARRAY['inversión','renta','rentabilidad','alquiler']),
  ('00000000-0000-0000-0000-000000000001', 'Familia', '#10B981', 'nuevo', true, ARRAY['familia','hijos','colegio','jardín']),
  ('00000000-0000-0000-0000-000000000001', 'Crédito', '#3B82F6', 'nuevo', true, ARRAY['crédito','hipoteca','banco','cuotas'])
ON CONFLICT DO NOTHING;

-- Propiedades de prueba
INSERT INTO propiedades (tenant_id, titulo, tipo, precio, zona, dormitorios, banos, descripcion, activa)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Departamento 3 ambientes en Palermo Soho', 'venta', 185000, 'Palermo', 2, 1, 'Luminoso departamento en el corazón de Palermo Soho. Contrafrente tranquilo, piso 8, con balcón. Cocina americana integrada.', true),
  ('00000000-0000-0000-0000-000000000001', 'PH dúplex en Villa Crespo', 'venta', 230000, 'Villa Crespo', 3, 2, 'PH dúplex con terraza propia de 40m2. Ideal para familia. Dos plantas, luminoso, reformado a nuevo.', true),
  ('00000000-0000-0000-0000-000000000001', 'Monoambiente premium en Recoleta', 'alquiler', 280000, 'Recoleta', 1, 1, 'Monoambiente completamente equipado, edif con amenities. Ideal estudiante o profesional. Disponible inmediato.', true),
  ('00000000-0000-0000-0000-000000000001', 'Casa 4 amb con jardín en Belgrano R', 'venta', 420000, 'Belgrano', 4, 3, 'Casa amplia en Belgrano R, 300m2 cubiertos + jardín de 200m2. Garage para 2 autos. Zona muy tranquila, colegios a 5 cuadras.', true)
ON CONFLICT DO NOTHING;
