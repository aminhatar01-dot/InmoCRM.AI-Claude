# InmoCRM.AI

CRM inmobiliario nativo en IA. Plataforma SaaS multi-tenant con agente conversacional, bandeja omnicanal y gestion inteligente de leads para inmobiliarias de Latinoamerica.

## Stack tecnologico

| Capa | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript strict, Tailwind CSS |
| Backend / DB | Supabase (Postgres + pgvector + Realtime + Storage) |
| Auth | Supabase Auth (JWT + RLS multi-tenant) |
| IA | OpenAI GPT-4o (agente), text-embedding-3-small (RAG) |
| Edge Functions | Deno (Supabase Functions) |
| Billing | Stripe REST API (sin SDK) |
| PWA | Service Worker nativo, Web Push |
| Charts | Recharts |
| Iconos | Lucide React |
| Estado global | Zustand |

## Arquitectura multi-tenant

Cada agencia (tenant) tiene su propio espacio completamente aislado mediante Row Level Security en Postgres. La funcion SQL `obtener_tenant_id_usuario()` inyecta el `tenant_id` en cada politica RLS, eliminando la necesidad de filtros manuales en el codigo de aplicacion.

```
Usuario → JWT → Supabase Auth → RLS → tenant_id aislado
```

## Fases del proyecto

| Fase | Modulo | Estado |
|---|---|---|
| 1 | Setup base: Next.js, Supabase, Tailwind, tipos | Completo |
| 2 | Auth completa + wizard onboarding 5 pasos | Completo |
| 3 | Bandeja omnicanal en tiempo real + agente IA | Completo |
| 4 | CRM completo: Kanban, propiedades, sync Tokko | Completo |
| 5 | Automatizaciones, campanas broadcast, notificaciones | Completo |
| 6 | Integraciones marketplace + Stripe billing | Completo |
| 7 | Analiticas Recharts, PWA, pagina de precios | Completo |

## Variables de entorno

Crear `.env.local` en la raiz del proyecto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://qwxybkzezjpsiccawqza.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>   # solo server-side, nunca exponer

# OpenAI
OPENAI_API_KEY=<api_key>                        # solo server-side

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_BASICO=price_...
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_...
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE=price_...

# Cifrado de credenciales de integraciones (AES-256-GCM)
ENCRYPTION_KEY=<32-caracteres-random>

# URL publica (para webhooks de Meta y Stripe)
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
```

### Configurar en Vercel

```bash
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENAI_API_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add ENCRYPTION_KEY
```

## Migraciones de base de datos

Aplicar en orden desde el dashboard de Supabase (SQL Editor) o via CLI:

```bash
supabase db push
```

| Archivo | Contenido |
|---|---|
| `001_schema_base.sql` | Tablas principales + RLS + triggers |
| `002_funciones_ia.sql` | Funciones SQL para el agente IA |
| `003_propiedades_vector.sql` | Extension pgvector + columna embedding |
| `004_indices_crm.sql` | Indices GIN, trigram, compuestos |
| `005_automatizaciones.sql` | Secuencias follow-up, campanas, notificaciones, pg_cron |
| `006_stripe_billing.sql` | Columnas Stripe, tabla pagos, paquetes_tokens |
| `007_funciones_analitica.sql` | Funciones SQL para dashboard de analiticas |

## Edge Functions de Supabase

Deployar todas las funciones:

```bash
supabase functions deploy agente-ia
supabase functions deploy vectorizar-propiedades
supabase functions deploy broadcast-whatsapp
supabase functions deploy motor-followup
supabase functions deploy detectar-recordatorios
```

Cada funcion requiere los secrets configurados en Supabase:

```bash
supabase secrets set OPENAI_API_KEY=<clave>
supabase secrets set ENCRYPTION_KEY=<clave>
```

## Webhooks a configurar

### Meta (WhatsApp / Instagram)
- URL: `https://tu-dominio.vercel.app/api/webhooks/meta`
- Verificacion: token configurado en `META_WEBHOOK_VERIFY_TOKEN`
- Eventos: `messages`, `message_reactions`

### Stripe
- URL: `https://tu-dominio.vercel.app/api/stripe/webhook`
- Eventos: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`
- El secreto de webhook va en `STRIPE_WEBHOOK_SECRET`

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Verificar tipos TypeScript
npx tsc --noEmit

# Supabase local (opcional)
supabase start
```

## Seguridad

- **NUNCA** exponer `SUPABASE_SERVICE_ROLE_KEY` o `OPENAI_API_KEY` al cliente
- Las credenciales de integraciones (WhatsApp, Tokko, etc.) se cifran con AES-256-GCM antes de guardar en la DB
- Los webhooks de Meta y Stripe verifican firma HMAC-SHA256
- RLS activo en TODAS las tablas — ninguna query accede a datos de otro tenant

## Estructura de carpetas

```
src/
  app/
    (aplicacion)/     # Rutas autenticadas (sidebar layout)
      tablero/
      bandeja/
      contactos/
      embudo/
      propiedades/
      campanas/
      analiticas/
      integraciones/
      configuracion/
    (auth)/           # Rutas publicas de autenticacion
    (marketing)/      # Landing pages publicas
      precios/
    api/              # Route Handlers (server-side)
  components/
    bandeja/
    contactos/
    embudo/
    propiedades/
    campanas/
    integraciones/
    compartidos/
  hooks/              # Hooks de React con logica de negocio
  lib/
    supabase/         # Clientes Supabase (servidor / cliente)
  types/              # Tipos TypeScript del dominio
supabase/
  functions/          # Edge Functions (Deno)
  migrations/         # Migraciones SQL ordenadas
public/
  sw.js               # Service Worker PWA
  manifest.json       # Web App Manifest
  offline.html        # Pagina offline
```

## Licencia

Propietario — InmoCRM.AI © 2025. Todos los derechos reservados.
