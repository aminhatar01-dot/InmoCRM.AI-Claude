# InmoCRM.AI 🏠

CRM inmobiliario nativo en IA. Plataforma SaaS multi-tenant con agente conversacional, bandeja omnicanal y gestión inteligente de leads para inmobiliarias.

## Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage + Edge Functions)
- **IA**: OpenAI GPT-4o + LangChain.js + pgvector (RAG)
- **Deploy**: Vercel (CI/CD con GitHub Actions)
- **Pagos**: Stripe + MercadoPago

## Setup local

### 1. Clonar el repositorio

```bash
git clone https://github.com/aminhatar01-dot/InmoCRM.AI-Claude.git
cd InmoCRM.AI-Claude
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
# Editar .env.local con tus credenciales
```

Variables mínimas para desarrollo:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

### 4. Configurar Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com)
2. Ejecutá la migración en el SQL Editor de Supabase:

```bash
# Copiá el contenido de supabase/migrations/001_esquema_inicial.sql
# y ejecutalo en el SQL Editor de tu proyecto Supabase
```

3. Copiá la URL y la clave anon de Settings → API en tu `.env.local`

### 5. Iniciar en desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

## Deploy a producción

El deploy es automático via GitHub Actions:

- Push a `main` → deploy en Vercel (producción)
- Push a `develop` o apertura de PR → deploy de preview

### Configurar secretos en GitHub

En Settings → Secrets and variables → Actions:

```
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=
```

## Estructura del proyecto

```
src/
├── app/
│   ├── (marketing)/      # Landing, precios, blog
│   ├── (autenticacion)/  # Login, registro, onboarding
│   ├── (aplicacion)/     # App autenticada
│   └── api/              # API routes
├── components/
│   ├── compartidos/      # Layout, sidebar, etc.
│   ├── bandeja/          # Inbox omnicanal
│   ├── embudo/           # Pipeline Kanban
│   └── ...
├── lib/
│   ├── supabase/         # Clientes Supabase
│   ├── ia/               # Agente LangChain + RAG
│   └── canales/          # WhatsApp, Instagram, etc.
├── hooks/                # Custom hooks
└── types/                # Tipos TypeScript
supabase/
├── migrations/           # SQL migrations
├── functions/            # Edge Functions (Deno)
└── seed.sql              # Datos de prueba
```

## Funcionalidades

- **Bandeja omnicanal**: WhatsApp, Instagram, Facebook, web — todo unificado con Supabase Realtime
- **Agente IA de ventas**: GPT-4o entrenado con tu catálogo, busca propiedades por semántica (pgvector)
- **Etiquetas Smart**: etiquetado automático de leads por IA
- **Embudo Kanban**: pipeline visual con drag-and-drop
- **Campañas masivas**: broadcast de WhatsApp con analíticas en tiempo real
- **Agenda de visitas**: sincronización con Google Calendar
- **Analíticas**: métricas de conversión, rendimiento por agente, consumo de tokens
- **Multi-tenant**: RLS en todas las tablas, aislamiento garantizado por `tenant_id`

## Endpoint de salud

```
GET /api/salud
```

## Licencia

Propietario — © 2024 InmoCRM.AI
